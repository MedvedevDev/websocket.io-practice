const users = []

// addUser, removeUser, getUser, getUsersInRoom

// Add user
const addUser = ({ id, username, room }) => { // id -  id of the connection,
    // Clean the data
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    // Validate the data
    if (!username || !room) {
        return {
            error: 'Username and room are required'
        }
    }

    // Check for existing user in the current room
    const existingUser = users.find(user => user.username === username && user.room === room);
    if (existingUser) {
        return {
            error: 'User with thus username is already in the room!'
        }
    }

    // Store user
    const user = { id, username, room };
    users.push(user);

    return { user };
}

// Remove user
const removeUser = (id) => {
    const index = users.findIndex(user => user.id === id); // -1 if no result, > 0 if item is found
    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}


const getUser = (id) => {
    const user = users.find(user => user.id === id);
    if (user) {
        return user;
    }
    return undefined;
}

const getUsersInRoom = (room) => {
    return  users.filter(user => user.room === room)
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}