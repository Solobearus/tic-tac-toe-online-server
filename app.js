var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var app = express();

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const users = {};
const rooms = [];
let queue = null;
var server = require(`http`).Server(app);
var io = require(`socket.io`)(server);


app.post('/', (req, res) => {
    console.log(req.body)
    if (users[req.body.username]) {
        res.status(409).send();
    } else {
        users[req.body.username] = {
            socketid: null,
            playing: false,
            room: null,
        }
        res.status(200).send();
    }
});

io.on('connection', (socket) => {
    let username = socket.handshake.query.username;
    if (users[username]) {
        users[username].socketid = socket.id;
    }

    socket.on('checkForPlayers', (data) => {
        if (!queue) {
            queue = data.username;
            console.log(data.username);
            console.log("!queue",queue);
            socket.emit('queued');
        } else {
            rooms.push({
                players: [username, queue],
                matrix: [
                    [0, 0, 0],
                    [0, 0, 0],
                    [0, 0, 0]
                ],
                turn: 0,
            })
            console.log("queue",users[queue]);
            socket.to(users[queue].socketid).emit('roomCreated');
        }
    })
});

module.exports = { app, server };
