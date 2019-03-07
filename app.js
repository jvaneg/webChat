// libraries
const express = require("express");
const path = require("path");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const { User, Message } = require("./classes");

const PORT = 3333;


// sets express to use the views folder for views
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

//initialize static fileserving from /public folder
app.use(express.static(path.join(__dirname, "public")));

// start listening
http.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
});

// initialize data structures for msgs and users
let allUsers = {};
let activeUsers = {};
let messageList = [];
let userCount = 0;

// --- routes ---

// index route
app.get('/', (req, res) => {
    res.render("index");
});


// --- socket.io events ---

/*
connection
Handles new connection and session
*/
io.on("connection", (socket) => {
    let user = new User(`anon${userCount++}`);
    allUsers[user.name] = user;
    activeUsers[user.name] = user;
    let joinTimestamp = Date.now();
    console.log(`${joinTimestamp} - ${user.name} connected.`);
    io.emit("userConnected", user, joinTimestamp);

    /*
    disconnect
    Handles a user disconnecting
    */
    socket.on("disconnect", () => {
        delete activeUsers[user.name];
        let timestamp = Date.now();
        console.log(`${timestamp} - ${user.name} disconnected.`);
        io.emit("userDisconnected", user, timestamp);
    });

    /*
    send message
    Handles a user sending a new message to the server
    When the server receives a message, broadcasts it to all users
    */
    socket.on("sendMessage", (message) => {
        let newMessage = new Message(user, message);
        messageList.push(newMessage);
        console.log(`${newMessage.timestamp} - ${user.name}: ${newMessage.content}`);
        io.emit("newMessage", newMessage);
    });
});