import { useEffect } from "react";

export default function Receiver() {
    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8080");
        socket.onopen = () => {
            socket.send(JSON.stringify({ type: "receiver" }));
        };

        startReceiving(socket);
    }, []);

    function startReceiving(socket: WebSocket) {
        const pc = new RTCPeerConnection();
        const video = document.createElement("video");
        video.muted = true;
        document.getElementById("video-receiver")?.appendChild(video);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.send(
                    JSON.stringify({
                        type: "iceCandidate",
                        candidate: event.candidate,
                    })
                );
            }
        };

        pc.ontrack = (event) => {
            console.log("Received track", event);
            video.srcObject = new MediaStream([event.track]);
            video.play();
        };

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (message.type === "createOffer") {
                await pc.setRemoteDescription(message.sdp);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.send(
                    JSON.stringify({ type: "createAnswer", sdp: answer })
                );
                console.log("Received offer and sent answer");
            } else if (message.type === "iceCandidate") {
                await pc.addIceCandidate(message.candidate);
            }
        };
    }

    return <div id="video-receiver"></div>;
}
