// client javascript

var socket = io();

/*
newMessage
Handles receiving a new message from the server
*/
socket.on("newMessage", (message) => {
    console.log(`${new Date(message.timestamp).toLocaleTimeString()} - ${message.user.name}: ${message.content}`);

    let newMessageElem = $(document.createElement("li"))
        .text(`${new Date(message.timestamp).toLocaleTimeString()} - ${message.user.name}: ${message.content}`);

    $("#messages").append(newMessageElem);
});

/*
userConnected
Handles a user connected message from the server
Adds a message indicacting the new connection to the chat
Adds the user to the active users list
*/
socket.on("userConnected", (user, timestamp) => {
    console.log(`${new Date(timestamp).toLocaleTimeString()} - ${user.name} connected.`);

    let newMessageElem = $(document.createElement("li"))
        .text(`${new Date(timestamp).toLocaleTimeString()} - ${user.name} connected.`);
    let newUserElem = $(document.createElement("li"))
        .prop("id", user.name)
        .text(user.name)
        .css('color', user.colour);

    $("#messages").append(newMessageElem);
    $("#activeUsers").append(newUserElem);
});

/*
userDisconnected
Handles a user disconnecting message from the server
Adds a message indicacting the disconnection to the chat
Removes the user to the active users list
*/
socket.on("userDisconnected", (user, timestamp) => {
    console.log(`${new Date(timestamp).toLocaleTimeString()} - ${user.name} disconnected.`);

    let newMessageElem = $(document.createElement("li"))
        .text(`${new Date(timestamp).toLocaleTimeString()} - ${user.name} disconnected.`);

    $("#messages").append(newMessageElem);
    $(`#activeUsers > #${user.name}`).remove();
});

/*
userNameChange
Handles a user changed their name message from the server
Adds a message indicacting the user's name change
Changes the user's name in the active users list
*/
socket.on("userNameChange", (oldName, newName, timestamp) => {
    console.log(`${new Date(timestamp).toLocaleTimeString()} - ${oldName} changed name to ${newName}.`);
    
    let newMessageElem = $(document.createElement("li"))
        .text(`${new Date(timestamp).toLocaleTimeString()} - ${oldName} changed name to ${newName}.`);
    let userElem = $(`#activeUsers > #${oldName}`);
    
    $("#messages").append(newMessageElem);
    userElem
        .prop("id", newName)
        .text(newName);    
});

/*
userNameChangeError
Handles receiving an error from the server when trying to change name
*/
socket.on("userNameChangeError", (errMessage) => {
    console.log(`Error: ${errMessage}`);

    let newMessageElem = $(document.createElement("li"))
        .text(`Error: ${errMessage}.`);
    
    $("#messages").append(newMessageElem);
});

/*
userColourChange
Handles a user changed their colour message from the server
Adds a message indicacting the user's colour change
Changes the user's colour in the active users list
*/
socket.on("userColourChange", (user, oldColour, timestamp) => {
    console.log(`${new Date(timestamp).toLocaleTimeString()} - ${user.name} changed colour from to ${oldColour} to ${user.colour}.`);
    
    let newMessageElem = $(document.createElement("li"))
        .text(`${new Date(timestamp).toLocaleTimeString()} - ${user.name} changed colour from to ${oldColour} to ${user.colour}.`);
    let userElem = $(`#activeUsers > #${user.name}`);
    
    $("#messages").append(newMessageElem);
    userElem
        .css('color', user.colour);   
});

/*
userColourChangeError
Handles receiving an error from the server when trying to change colour
*/
socket.on("userColourChangeError", (errMessage) => {
    console.log(`Error: ${errMessage}`);

    let newMessageElem = $(document.createElement("li"))
        .text(`Error: ${errMessage}.`);
    
    $("#messages").append(newMessageElem);
});

/*
initialConnect
Handles a user initally connecting to the server
Adds the chat history and the list of active users
Tells the user their name
*/
socket.on("initialConnect", (activeUsers, messageList, user) => {
    //console.log(`${new Date(timestamp).toLocaleTimeString()} - ${user.name} changed colour from to ${oldColour} to ${user.colour}.`);
    
    // get own name
    let myName = $("#name");
    myName
        .text(user.name)
        .css('color', user.colour);

    // add messages from history
    let messageBlock = $("#messages");
    for( let message of messageList) {
        let newMessageElem = $(document.createElement("li"))
            .text(`${new Date(message.timestamp).toLocaleTimeString()} - ${message.user.name}: ${message.content}`);

        messageBlock.append(newMessageElem);
    }

    // add active user list
    let activeUsersBlock = $("#activeUsers");
    for( let activeUser of Object.values(activeUsers)) {
        let newUserElem = $(document.createElement("li"))
            .prop("id", activeUser.name)
            .text(activeUser.name)
            .css('color', activeUser.colour);

        activeUsersBlock.append(newUserElem);
    }
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