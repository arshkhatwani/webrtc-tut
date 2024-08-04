import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

let senderSocket: null | WebSocket = null;
let receiverSocket: null | WebSocket = null;

wss.on("connection", function connection(ws) {
    ws.on("error", console.error);

    ws.on("message", function message(data: any) {
        const message = JSON.parse(data);

        if (message.type === "sender") {
            senderSocket = ws;
            console.log("Sender connected");
        } else if (message.type === "receiver") {
            receiverSocket = ws;
            console.log("Receiver connected");
        } else if (message.type === "createOffer") {
            if (ws !== senderSocket) {
                return;
            }

            console.log("Offer created", message.sdp);

            receiverSocket?.send(
                JSON.stringify({
                    type: "createOffer",
                    sdp: message.sdp,
                })
            );
        } else if (message.type === "createAnswer") {
            if (ws !== receiverSocket) {
                return;
            }

            console.log("Answer created", message.sdp);

            senderSocket?.send(
                JSON.stringify({
                    type: "createAnswer",
                    sdp: message.sdp,
                })
            );
        } else if (message.type === "iceCandidate") {
            if (ws === senderSocket) {
                console.log("Ice candidate from sender", message.candidate);

                receiverSocket?.send(
                    JSON.stringify({
                        type: "iceCandidate",
                        candidate: message.candidate,
                    })
                );
            } else if (ws === receiverSocket) {
                console.log("Ice candidate from receiver", message.candidate);

                senderSocket?.send(
                    JSON.stringify({
                        type: "iceCandidate",
                        candidate: message.candidate,
                    })
                );
            }
        }
    });
});
