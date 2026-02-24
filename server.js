const http = require(‘http’);
const { ExpressPeerServer } = require(‘peer’);
const express = require(‘express’);

const app = express();
const server = http.createServer(app);

app.get(’/’, (req, res) => {
res.send(‘VAULT CHAT SERVER ONLINE’);
});

const peerServer = ExpressPeerServer(server, {
path: ‘/’,
allow_discovery: false
});

app.use(’/peerjs’, peerServer);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
console.log(’VAULT CHAT running on port ’ + PORT);
});
