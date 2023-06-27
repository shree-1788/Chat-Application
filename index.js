const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require("path");

app.get("/", (req, res) => {
  return res.sendFile(path.resolve("./public/index.html"));
});

const users = {};
const typingUsers = {};
const onlineUsers = {};

// sockets
io.on("connection", (socket) => {
  socket.on("new-user", (name) => {
    users[socket.id] = name;
    onlineUsers[socket.id] = name;
    socket.broadcast.emit("user-joined", name);
    io.emit("online-users", Object.values(onlineUsers));
  });

  socket.on("typing", () => {
    typingUsers[socket.id] = true;
    io.emit("typing", users[socket.id]);
  });

  socket.on("not-typing", () => {
    delete typingUsers[socket.id];
    io.emit("not-typing", users[socket.id]);
  });

  socket.on("send-chat-message", (msg) => {
    socket.broadcast.emit("chat-message", {
      message: msg,
      name: users[socket.id],
    });
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit("user-disconnected", users[socket.id]);
    delete onlineUsers[socket.id];
    delete typingUsers[socket.id];
    io.emit("online-users", Object.values(onlineUsers));
    io.emit("not-typing", users[socket.id]);
    delete users[socket.id];
  });
});

server.listen(3000, () => {
  console.log("server is running on port no. 3000");
});
