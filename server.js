const { PeerServer } = require(‘peer’);

const PORT = process.env.PORT || 3000;

const peerServer = PeerServer({
port: PORT,
path: ‘/peerjs’,
proxied: true,
allow_discovery: false,
key: ‘vault’
});

peerServer.on(‘connection’, client => {
console.log(’Client connected: ’ + client.getId());
});

peerServer.on(‘disconnect’, client => {
console.log(’Client disconnected: ’ + client.getId());
});

console.log(’VAULT CHAT Server running on port ’ + PORT);
