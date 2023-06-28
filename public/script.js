const socket = io();
const form = document.getElementById("form");
const input = document.getElementById("input");
const typingStatus = document.getElementById("typing-status");
const allMessages = document.getElementById("messages");
const onlineUsersConatiner = document.getElementById("onlineUsers");
const roomContainer = document.getElementById("room-container");

if (form != null) {
  const name = prompt("What is your name?");
  appendChat("You joined the chat");
  socket.emit("new-user", roomName, name);
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (input.value) {
      appendChat(`You: ${input.value}`);
      socket.emit("send-chat-message", roomName, input.value);

      input.value = "";
      socket.emit("not-typing", roomName);
    }
  });
}

input.addEventListener("input", function () {
  if (input.value.length > 0) socket.emit("typing", roomName);
  else socket.emit("not-typing", roomName);
});

socket.on("online-users", function (users) {
  onlineUsersConatiner.innerHTML = "";
  users.map((user) => {
    const userElement = document.createElement("p");
    userElement.innerText = `${user} online 💚`;
    onlineUsersConatiner.appendChild(userElement);
  });
});

// room created
socket.on("room-created", (room) => {
  // <div><%= room %></div>   // Similar format need
  // <a href="/<%=room%>">Join</a>
  const rootElement = document.createElement("div");
  rootElement.innerText = room;
  const rootLink = document.createElement("a");
  rootLink.href = `/${room}`;
  rootLink.innerText = "Join";
  roomContainer.append(rootElement);
  roomContainer.append(rootLink);
});

socket.on("user-joined", function (name) {
  if (name) appendChat(`${name} joined the chat`);
});

socket.on("chat-message", function (msg) {
  if (msg) appendChat(`${msg.name}: ${msg.message}`);
});

socket.on("typing", function (name) {
  typingStatus.innerText = `${name} is typing.....`;
});

socket.on("not-typing", function (name) {
  typingStatus.innerText = "";
});

socket.on("user-disconnected", function (name) {
  if (name) appendChat(`${name} left the chat`);
});

function appendChat(msg) {
  const item = document.createElement("li");
  item.textContent = msg;
  allMessages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
}
