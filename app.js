// libraries
const express = require("express");
const path = require("path");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const cookieParser = require("cookie-parser");
const cookie = require("cookie");
const { User, Message } = require("./src/classes");

// constants
const PORT = 3333;

const MessageType = {
    NORMAL: 1,
    NICKNAME: 2,
    COLOUR: 3,
};

const NICK_COMMAND = "/nick";
const COLOUR_COMMAND = "/nickcolor";


// sets express to use the views folder for views
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// cookie middleware
app.use(cookieParser());

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
    let expiration = 24 * 60 * 60 * 1000; // 1 day

    if(("userName" in req.cookies) && (req.cookies["userName"] in allUsers)) {
        res.cookie("userName", req.cookies["userName"], { maxAge: expiration });
    } else {
        res.cookie("userName", req.cookies["userName"], { maxAge: expiration });
    }

    res.render("index");
});


// --- socket.io events ---

/*
connection
Handles new connection and session
*/
io.on("connection", (socket) => {
    let userName = null;
    let user = null;
    let rawCookie = socket.request.headers.cookie || socket.handshake.headers.cookie;
    
    if(!rawCookie === undefined) {
        let clientCookies = cookie.parse(rawCookie);
    
        if(("userName" in clientCookies) && (clientCookies["userName"] in allUsers)) {
            userName = clientCookies["userName"];
            user = allUsers[userName];
        } else {
            userName = generateNewName();
            user = new User(userName);
            allUsers[user.name] = user;
        }

    } else {
        userName = generateNewName();
        user = new User(userName);
        allUsers[user.name] = user;
    }

    let joinTimestamp = Date.now();

    socket.emit("initialConnect", activeUsers, messageList, user);

    activeUsers[user.name] = user;

    console.log(`${new Date(joinTimestamp).toLocaleTimeString()} - ${user.name} connected.`);
    io.emit("userConnected", user, joinTimestamp);

    /*
    disconnect
    Handles a user disconnecting
    */
    socket.on("disconnect", () => {
        delete activeUsers[user.name];
        let timestamp = Date.now();

        console.log(`${new Date(timestamp).toLocaleTimeString()} - ${user.name} disconnected.`);
        io.emit("userDisconnected", user, timestamp);
    });

    /*
    send message
    Handles a user sending a new message to the server
    When the server receives a message, broadcasts it to all users
    */
    socket.on("sendMessage", (message) => {
        messageType = getMessageType(message);
        let result = null;

        switch(messageType) {
            case MessageType.NICKNAME:
                result = processNickMessage(message, user);

                if(!result[0]) {
                    console.log(`${new Date(result[1].timestamp).toLocaleTimeString()} - ${result[1].oldName} changed name to ${result[1].newName}.`);
                    io.emit("userNameChange", result[1].oldName, result[1].newName, result[1].timestamp);
                }
                else {
                    console.log(`Error: ${result[1]}`);
                    socket.emit("userNameChangeError", result[1]);
                }

                break;

            case MessageType.COLOUR:
                console.log("colour message");

                result = processColourMessage(message, user);

                if(!result[0]) {
                    console.log(`${new Date(result[1].timestamp).toLocaleTimeString()} - ${result[1].user.name} changed colour from ${result[1].oldColour} to ${result[1].user.colour}.`);
                    io.emit("userColourChange", result[1].user, result[1].oldColour, result[1].timestamp);
                }
                else {
                    console.log(`Error: ${result[1]}`);
                    socket.emit("userColourChangeError", result[1]);
                }

                break;

            default:
                let newMessage = new Message(user, message);
                messageList.push(newMessage);

                console.log(`${new Date(newMessage.timestamp).toLocaleTimeString()} - ${user.name}: ${newMessage.content}`);
                io.emit("newMessage", newMessage);
        }
    });
});

// --- helper functions ---

/*
getMessageType
Determines the type of message
*/
function getMessageType(message) {
    let splitMessage = message.split(" ", 2);
    if(splitMessage[0] === NICK_COMMAND) {
        return MessageType.NICKNAME;
    }
    else if(splitMessage[0] === COLOUR_COMMAND) {
        return MessageType.COLOUR;
    }
    
    return MessageType.NORMAL;
}

/*
processNickMessage
processes a nickname change event
*/
function processNickMessage(message, user) {
    let error = false;
    let errMessage = "";
    let splitMessage = message.split(" ", 2);
    let newNick = "";
    let result = null;
    let nickCheck = /^[a-z0-9]+$/i;

    if(splitMessage.length < 2) {
        error = true;
        errMessage = `${NICK_COMMAND} requires an argument.`;
    } else {
        newNick = message.substring(NICK_COMMAND.length).trim();

        if(newNick === "") {
            error = true;
            errMessage = "nickname cannot be blank.";
        } else if (newNick.length >= 32) {
            error = true;
            errMessage = "nickname cannot be more than 32 chars.";
        } else if (!nickCheck.test(newNick)) {
            error = true;
            errMessage = "nickname must be alphanumeric.";
        } else if (newNick in allUsers) {
            error = true;
            errMessage = `${newNick} is already in use.`;
        } else {
            oldNick = user.name;

            user.name = newNick;
            allUsers[newNick] = user;
            activeUsers[newNick] = user;

            delete allUsers[oldNick];
            delete activeUsers[oldNick];

            let timestamp = Date.now();

            result = {
                oldName: oldNick,
                newName: newNick,
                timestamp: timestamp,
            };
        }
    }

    if(error) {
        result = errMessage;
    }

    return [error, result];
}

/*
processColourMessage
process a colour change event
*/
function processColourMessage(message, user) {
    let error = false;
    let errMessage = "";
    let splitMessage = message.split(" ", 2);
    let newColour = "";
    let result = null;
    let colourCheck = /^[A-F0-9]{6}/i;

    if(splitMessage.length < 2) {
        error = true;
        errMessage = `${COLOUR_COMMAND} requires an argument.`;
    } else {
        newColour = message.substring(COLOUR_COMMAND.length).trim();

        if(newColour === "") {
            error = true;
            errMessage = "colour cannot be blank.";
        } else if(!colourCheck.test(newColour.toUpperCase())) {
            error = true;
            errMessage = `${newColour} is not a valid colour`;
        } else {
            let oldColour = user.colour;
            user.colour = `#${newColour}`;
            let timestamp = Date.now();

            result = {
                user: user,
                oldColour: oldColour,
                timestamp: timestamp,
            };
        }
    }

    if(error) {
        result = errMessage;
    }

    return [error, result];
}

/*
generateNewName
generates a new username for a user without one
*/
function generateNewName() {
    let userName = null;
    do {
        userName = `anon${userCount++}`;
    } while(userName in allUsers);

    return userName;
}