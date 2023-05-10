const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io')
const formatMsg = require('../utils/msg');
const { userJoin, getCurrUser, userLeave, getRoomUser } = require('../utils/users');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = process.env.PORT || 5000;

// public static path
const staticPath = path.join(__dirname, '../public');

app.use(express.static(staticPath));

const botName = 'AppBot';

// client connection
io.on('connection', (socket) => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room); 
        
        socket.join(user.room)
        
        // welcome new user
        socket.emit('message', formatMsg(botName, 'Welcome to Communication !!'));
    
        // broadcast message
        socket.broadcast.to(user.room).emit('message', formatMsg(botName,`${user.username} has joined the chat`));

        // info of users & rooms
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUser(user.room)
        })
    
    })

    // listen for chat msg
    socket.on('chatMessage', (msg) => {
        const user = getCurrUser(socket.id);

        io.to(user.room).emit('message', formatMsg(user.username, msg));
    })

    // client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMsg(botName,`${user.username} has left the chat`)); 

            // info of users & rooms
            io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUser(user.room)
        })
        }

    })
})


server.listen(port, () => {
    console.log(`listening to the port ${port}`);
});