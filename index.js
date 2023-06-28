const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require("path");

app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

const rooms = {};

app.get("/", (req, res) => {
  return res.render("index", { rooms: rooms });
});

app.get("/:room", (req, res) => {
  // If room doesn't exist
  if (rooms[req.params.room] == null) return res.redirect("/");

  return res.render("room", { roomName: req.params.room });
});

app.post("/room", (req, res) => {
  if (rooms[req.body.room] != null) return res.redirect("/");
  rooms[req.body.room] = { users: {} };
  res.redirect(req.body.room);
  // actual message that room was created
  io.emit("room-created", req.body.room);
});

// const users = {};
// const typingUsers = {};
// const onlineUsers = {};

// sockets
io.on("connection", (socket) => {
  socket.on("new-user", (room, name) => {
    socket.join(room);
    rooms[room].users[socket.id] = name;
    // onlineUsers[socket.id] = name;
    socket.broadcast.to(room).emit("user-joined", name);
    io.to(room).emit("online-users", Object.values(rooms[room].users));
    // console.log(rooms[room].users);
  });

  socket.on("typing", (room) => {
    // typingUsers[socket.id] = true;
    socket.broadcast.to(room).emit("typing", rooms[room].users[socket.id]);
  });

  socket.on("not-typing", (room) => {
    // delete typingUsers[socket.id];
    socket.broadcast.to(room).emit("not-typing", rooms[room].users[socket.id]);
  });

  socket.on("send-chat-message", (room, msg) => {
    socket.broadcast.to(room).emit("chat-message", {
      message: msg,
      name: rooms[room].users[socket.id],
    });
  });

  socket.on("disconnect", () => {
    getUserRooms(socket).forEach((room) => {
      socket.broadcast
        .to(room)
        .emit("user-disconnected", rooms[room].users[socket.id]);
      socket.to(room).emit("not-typing", rooms[room].users[socket.id]);
      delete rooms[room].users[socket.id];
      io.to(room).emit("online-users", Object.values(rooms[room].users));
    });
  });
});

function getUserRooms(socket) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[socket.id] != null) names.push(name);
    return names;
  }, []);
}

server.listen(8000, () => {
  console.log("server is running on port no. 8000");
});
