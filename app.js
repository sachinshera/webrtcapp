const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const path = require("path");

app.use("/static", express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
})
io.on("connection", function (socket) {
    console.log("a user is connected");
    socket.on("create join", room => {
        console.log("create or join room ");
        const myroom = io.sockets.adapter.rooms[room] || { length: 0 };
        const numberClient = myroom.length;
        console.log(room + " has " + numberClient + " clients");
        if (numberClient == 0) {
            socket.join(room);
            socket.emit("created", room);
            console.log("room created");
        } else if (numberClient == 1) {
            socket.join(room);
            socket.emit("joined", room);
            console.log("room joined");
        }
        else {
            socket.emit("full");
        }
    })
    socket.on("ready", room => {
        socket.broadcast.to(room).emit("ready");
    })
    socket.on("candidate", event => {
        socket.broadcast.to(event.room).emit("candidate", event);
    })
    socket.on("offer", event => {
        socket.broadcast.to(event.room).emit("offer", event.sdp);
    })
    socket.on("answer", event => {
        socket.broadcast.to(event.room).emit("answer", event.sdp);
    })
})

http.listen(port, () => {
    console.log("app is running on ", port);
})