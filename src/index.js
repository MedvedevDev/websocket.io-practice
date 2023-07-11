const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, getUsersInRoom, removeUser, getUser } = require('./utils/users')
require('dotenv').config({path: __dirname + '/.env'})

const app = express()
const server = http.createServer(app)
const io = socketio(server) // socket.io expects to be called with the raw http server

const PORT = process.env.PORT
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

// server (emit) -> client (receive) -> acknowledgement -->server
// client (emit) -> server (receive) -> acknowledgement -->client

io.on('connection', (socket) => {
    console.log('New Socket connection');
    // {username, room} IS REPLACED WITH 'optionsFromQuery' OBJECT AS ARGUMENT AND THEN DESTRUCTURED WITH SPREAD OPERATOR
    // socket.on('join', (optionsFromQuery, acknowledgementCallback) => {
    //  const { error, user } = addUser({ id: socket.id, ...optionsFromQuery});

    socket.on('join', ({ username, room }, acknowledgementCallback) => {
    const { error, user } = addUser({ id: socket.id, username: username, room: room });
        if (error) {
            return acknowledgementCallback(error);
        }

        socket.join(user.room);

        socket.emit('message', generateMessage('Admin', 'Welcome'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`)) // send to everybody except this particular socket

        acknowledgementCallback();
    })

    // whoever is emiting event sets up a callback function, whoever is receiving event receives a callback function that need to call
    // optionally the data can be transfered between callbacks
    socket.on('sendMessage', (message, acknowledgementCallback) => { // confirmationCallback - acknowledgement callback
        const filter = new Filter()

        if (filter.isProfane(message)) {
            return acknowledgementCallback('Profanity is not allowed!')
        }

        const user = getUser(socket.id);

        // Send chat message
        io.to(user.room).emit('message', generateMessage(user.username, message))
        acknowledgementCallback('Delivered!') // Optional: Message to be delivered from server to client
    });

    // Send location
    socket.on('sendLocation', (location, acknowledgementCallback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${location.lat},${location.lat}`))
        acknowledgementCallback('Location shared!');
    });

    socket.on('disconnect', () => {
        // Removing user from the array when he is disconnected
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
        }
    });
});

server.listen(PORT, () => console.log(`Server is up on port ${PORT}`));
