// cspanent javascript

var socket = io();

/*
newMessage
Handles receiving a new message from the server
*/
socket.on("newMessage", (message) => {
    console.log(`${new Date(message.timestamp).toLocaleTimeString()} - ${message.user.name}: ${message.content}`);

    let timestampElem = $(document.createElement("span"))
        .addClass("timestamp")
        .text(`${new Date(message.timestamp).toLocaleTimeString()} - `);

    let authorElem = $(document.createElement("span"))
        .addClass("author")
        .text(`${message.user.name}`)
        .css("color", message.user.colour);

    let messageElem = $(document.createElement("span"))
        .addClass("message")
        .text(`: ${message.content}`);

    let newMessageElem = $(document.createElement("span"))
        .append(timestampElem)
        .append(authorElem)
        .append(messageElem);

    let myName = $("#name");
    if(myName.text() === message.user.name) {
        newMessageElem.css("font-weight", "bold");
    }

    $("#messages").append(newMessageElem);

    let messageElems = $("#messages");
    messageElems.scrollTop(messageElems.prop("scrollHeight"));
});

/*
userConnected
Handles a user connected message from the server
Adds a message indicacting the new connection to the chat
Adds the user to the active users spanst
*/
socket.on("userConnected", (user, timestamp) => {
    console.log(`${new Date(timestamp).toLocaleTimeString()} - ${user.name} connected.`);

    let newMessageElem = $(document.createElement("span"))
        .text(`${new Date(timestamp).toLocaleTimeString()} - ${user.name} connected.`)
        .addClass("nonMessage");
    let newUserElem = $(document.createElement("span"))
        .prop("id", user.name)
        .text(user.name)
        .css("color", user.colour);

    $("#messages").append(newMessageElem);
    $("#activeUsers").append(newUserElem);
});

/*
userDisconnected
Handles a user disconnecting message from the server
Adds a message indicacting the disconnection to the chat
Removes the user to the active users spanst
*/
socket.on("userDisconnected", (user, timestamp) => {
    console.log(`${new Date(timestamp).toLocaleTimeString()} - ${user.name} disconnected.`);

    let newMessageElem = $(document.createElement("span"))
        .text(`${new Date(timestamp).toLocaleTimeString()} - ${user.name} disconnected.`)
        .addClass("nonMessage");

    $("#messages").append(newMessageElem);
    $(`#activeUsers > #${user.name}`).remove();
});

/*
userNameChange
Handles a user changed their name message from the server
Adds a message indicacting the user's name change
Changes the user's name in the active users spanst
*/
socket.on("userNameChange", (oldName, newName, timestamp) => {
    console.log(`${new Date(timestamp).toLocaleTimeString()} - ${oldName} changed name to ${newName}.`);
    
    let newMessageElem = $(document.createElement("span"))
        .text(`${new Date(timestamp).toLocaleTimeString()} - ${oldName} changed name to ${newName}.`)
        .addClass("nonMessage");
    let userElem = $(`#activeUsers > #${oldName}`);
    
    $("#messages").append(newMessageElem);
    userElem
        .prop("id", newName)
        .text(newName);

    let myName = $("#name");
    if(myName.text() === oldName) {
        myName.text(newName);
        // set cookie
        cookie.set("userName", newName, 1); //lasts one day
    }
    
});

/*
userNameChangeError
Handles receiving an error from the server when trying to change name
*/
socket.on("userNameChangeError", (errMessage) => {
    console.log(`Error: ${errMessage}`);

    let newMessageElem = $(document.createElement("span"))
        .text(`Error: ${errMessage}`)
        .addClass("nonMessage");
    
    $("#messages").append(newMessageElem);
});

/*
userColourChange
Handles a user changed their colour message from the server
Adds a message indicacting the user's colour change
Changes the user's colour in the active users spanst
*/
socket.on("userColourChange", (user, oldColour, timestamp) => {
    console.log(`${new Date(timestamp).toLocaleTimeString()} - ${user.name} changed colour from to ${oldColour} to ${user.colour}.`);
    
    let newMessageElem = $(document.createElement("span"))
        .text(`${new Date(timestamp).toLocaleTimeString()} - ${user.name} changed colour from to ${oldColour} to ${user.colour}.`)
        .addClass("nonMessage");
    let userElem = $(`#activeUsers > #${user.name}`);
    
    $("#messages").append(newMessageElem);
    userElem
        .css("color", user.colour);

    let myName = $("#name");
    if(myName.text() === user.name) {
        myName.css("color", user.colour);
    }
});

/*
userColourChangeError
Handles receiving an error from the server when trying to change colour
*/
socket.on("userColourChangeError", (errMessage) => {
    console.log(`Error: ${errMessage}`);

    let newMessageElem = $(document.createElement("span"))
        .text(`Error: ${errMessage}`)
        .addClass("nonMessage");
    
    $("#messages").append(newMessageElem);
});

/*
initialConnect
Handles a user initally connecting to the server
Adds the chat history and the spanst of active users
Tells the user their name
*/
socket.on("initialConnect", (activeUsers, messagespanst, user) => {
    //console.log(`${new Date(timestamp).toLocaleTimeString()} - ${user.name} changed colour from to ${oldColour} to ${user.colour}.`);
    
    // get own name
    let myName = $("#name");
    myName
        .text(user.name)
        .css('color', user.colour);

    // add messages from history
    let messageBlock = $("#messages");
    for( let message of messagespanst) {
        let timestampElem = $(document.createElement("span"))
            .addClass("timestamp")
            .text(`${new Date(message.timestamp).toLocaleTimeString()} - `);

        let authorElem = $(document.createElement("span"))
            .addClass("author")
            .text(`${message.user.name}`)
            .css("color", message.user.colour);

        let messageElem = $(document.createElement("span"))
            .addClass("message")
            .text(`: ${message.content}`);

        let newMessageElem = $(document.createElement("span"))
            .append(timestampElem)
            .append(authorElem)
            .append(messageElem);

        let myName = $("#name");
        if(myName.text() === message.user.name) {
            newMessageElem.css("font-weight", "bold");
        }

        $("#messages").append(newMessageElem);
    }

    // add active user spanst
    let activeUsersBlock = $("#activeUsers");
    for( let activeUser of Object.values(activeUsers)) {
        let newUserElem = $(document.createElement("span"))
            .prop("id", activeUser.name)
            .text(activeUser.name)
            .css('color', activeUser.colour);

        activeUsersBlock.append(newUserElem);
    }

    // set cookie
    cookie.set("userName", user.name, 1); //lasts one day

    let messageElems = $("#messages");
    messageElems.scrollTop(messageElems.prop("scrollHeight"));
});


// jquery document.onready
$(function () {

    // on submitting with the "Send" button
    $('form').submit(function(e) {
        e.preventDefault(); // prevents page reloading
        socket.emit('sendMessage', $('#inputMsg').val());
        $('#inputMsg').val('');
        return false;
    });
});