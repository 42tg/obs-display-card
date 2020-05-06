import express from "express";
import http from "http";
import socketIO from "socket.io";
import { createSocket } from "dgram";

const app = express();

const httpServer = http.createServer(app);
const io = socketIO(httpServer);

let socketMapping = {};

io.on("connection", (socket) => {
  console.log("User Connected");
  socket.on("register", (id) => {
    socketMapping[id] = [...(socketMapping[id] || []), socket];

    socket.emit("card.id", "44012bb8-17b7-4b50-a796-662ef09bfc29");

    socket.on("card.push", (cardId) => {
      console.log("broadcasting Card", cardId);
      socketMapping[id].forEach((targetSocket) => {
        targetSocket.emit("card.id", cardId);
      });
    });
  });

  socket.on("disconnect", () => {
    socketMapping = Object.fromEntries(
      Object.entries(socketMapping).map(([id, mapPerId]) =>
        //@ts-ignore
        [id, mapPerId.filter((targetSocket) => socket.id !== targetSocket.id)]
      )
    );

    console.log("Disconnected");
  });
});
app.get("/", (req, res) => res.json({ running: true }));

httpServer.listen(8000);
