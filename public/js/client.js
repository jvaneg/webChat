// client javascript

var socket = io();

/*
new message
Handles receiving a new message from the server
*/
socket.on("newMessage", (message) => {
    console.log(`${message.timestamp} - ${message.user.name}: ${message.content}`);
    $("#messages").append($("<li>").text(`${message.timestamp} - ${message.user.name}: ${message.content}`));
});

socket.on("userConnected", (user, timestamp) => {
    console.log(`${user.name} connected.`);
    $("#messages").append($("<li>").text(`${timestamp} - ${user.name} connected.`));
});

socket.on("userDisconnected", (user, timestamp) => {
    console.log(`${user.name} disconnected.`);
    $("#messages").append($("<li>").text(`${timestamp} - ${user.name} disconnected.`));
});


// jquery document.onready
$(function () {
    // on submitting with the "Send" button
    $('form').submit(function(e){
        e.preventDefault(); // prevents page reloading
        socket.emit('sendMessage', $('#m').val());
        $('#m').val('');
        return false;
    });
});