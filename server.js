const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server);
const { ExpressPeerServer } = require("peer");
const url = require("url");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});
const path = require("path");

app.set("view engine", "ejs");
app.set('views', __dirname + '/views')

app.use("/public", express.static(path.join(__dirname, "static")));
app.use("/peerjs", peerServer);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "static", "index.html"));
});

app.get("/join", (req, res) => {
  res.redirect(
    url.format({
      pathname: `/join/${uuidv4()}`,
      query: req.query,
    })
  );
});

app.get("/joinold", (req, res) => {
  res.redirect(`join/${req.query.meeting_id}`);
});

app.get("/join/:rooms", (req, res) => {
  res.render("room.ejs", { roomid: req.params.rooms, Myname: req.query.name });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, id, myname) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", id, myname);

    socket.on("messagesend", (message) => {
      io.to(roomId).emit("createMessage", message);
    });

    socket.on("tellName", (myname) => {
      socket.to(roomId).broadcast.emit("AddName", myname);
    });

    socket.on("disconnect", () => {
      socket.to(roomId).broadcast.emit("user-disconnected", id);
    });
  });
});

server.listen(3030);
