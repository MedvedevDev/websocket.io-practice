// -----------------------------------------------client side script
const socket = io()

// Elements
const messageFormInput = document.querySelector('input')
const messageForm = document.querySelector('#message-form')
const messageFormBtn = document.querySelector('button')
const sendLocationBtn = document.querySelector('#send-location')
const messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-message-template').innerHTML

// Parse query string as key-value pairs, returns object
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

// Receive messages
socket.on('message', (message) => {
    // Render message templates
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
})

// Sending messages
messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    // disable form
    messageFormBtn.setAttribute('disabled', 'disabled')

    const message = messageFormInput.value

    socket.emit('sendMessage', message, (error) => { // error - Optional: Confirmation message delivered from server
        // enable form
        messageFormBtn.removeAttribute('disabled')
        messageFormInput.value = ''
        messageFormInput.focus()

        //console.log('The message was delivered!', error)
        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

// Send location
sendLocationBtn.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported')
    }

    //disable button
    sendLocationBtn.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition(position => {
        socket.emit('sendLocation', {
            long: position.coords.longitude,
            lat: position.coords.latitude },  (acknowledgementMessage) => {
            // enable button
            sendLocationBtn.removeAttribute('disabled');
            console.log(acknowledgementMessage);
        })
    })
})

// Receive location message
socket.on('locationMessage', (location) => {
    // Render location template
    const html = Mustache.render(locationTemplate, {
        username: location.username,
        url: location.url,
        createdAt: moment(location.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
})

// Send username and room + acknowledgement
socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
})