const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
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

    socket.emit('message', generateMessage('Welcome'))
    socket.broadcast.emit('message', generateMessage('New user has joined')) // send to everybody except this particular socket

    // whoever is emiting event sets up a callback function, whoever is receiving event receives a callback function that need to call
    // optionally the data can be transfered between callbacks
    socket.on('sendMessage', (message, acknowledgementCallback) => { // confirmationCallback - acknowledgement callback
        const filter = new Filter()

        if (filter.isProfane(message)) {
            return acknowledgementCallback('Profanity is not allowed!')
        }

        // Send chat message
        io.emit('message', generateMessage(message))
        acknowledgementCallback('Delivered!') // Optional: Message to be delivered from server to client
    });

    // Send location
    socket.on('sendLocation', (location, acknowledgementCallback) => {
        io.emit('locationMessage', generateLocationMessage(`https://google.com/maps?q=${location.lat},${location.lat}`))
        acknowledgementCallback('Location shared!');
    });

    socket.on('disconnect', () => io.emit('message', generateMessage('User has left!')));
})



server.listen(PORT, () => console.log(`Server is up on port ${PORT}`));
