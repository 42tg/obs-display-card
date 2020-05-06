import express from "express";
import http from "http";
import socketIO from "socket.io";
import path from "path";
const app = express();

const httpServer = http.createServer(app);
const io = socketIO(httpServer);

let socketMapping = {};

io.on("connection", (socket) => {
  console.log("User Connected");

  socket.on("register", (id) => {
    socketMapping[id] = [...(socketMapping[id] || []), socket];

    socket.on("card.push", (cardId) => {
      console.log("Broadcasting Card", cardId);
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

app.use(express.static("../client/build"));
app.get("*", (req, res) =>
  res.sendFile(path.resolve("..", "client", "build", "index.html"))
);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT);
