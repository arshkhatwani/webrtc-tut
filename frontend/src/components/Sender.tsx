import { useEffect, useState } from "react";

export default function Sender() {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    async function initiateConn() {
        if (!socket) {
            console.log("Sender socket not found");
            return;
        }

        const pc = new RTCPeerConnection();

        pc.onnegotiationneeded = async () => {
            const offer = await pc.createOffer();
            socket?.send(JSON.stringify({ type: "createOffer", sdp: offer }));
            pc.setLocalDescription(offer);
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket?.send(
                    JSON.stringify({
                        type: "iceCandidate",
                        candidate: event.candidate,
                    })
                );
            }
        };

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (message.type === "createAnswer") {
                console.log("Received answer");
                await pc.setRemoteDescription(message.sdp);
            } else if (message.type === "iceCandidate") {
                await pc.addIceCandidate(message.candidate);
            }
        };

        getCameraFeedAndSend(pc);
    }

    function getCameraFeedAndSend(pc: RTCPeerConnection) {
        navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
            const video = document.createElement("video");
            video.srcObject = stream;
            video.play();

            document.body.appendChild(video);
            stream.getTracks().forEach((track) => {
                pc.addTrack(track);
            });
        });
    }

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8080");
        socket.onopen = () => {
            socket.send(JSON.stringify({ type: "sender" }));
        };
        setSocket(socket);
    }, []);

    return (
        <div>
            Sender
            <button onClick={initiateConn}>Send data</button>
        </div>
    );
}
