const { PeerServer } = require(‘peer’);
const express = require(‘express’);
const app = express();

const PORT = process.env.PORT || 3000;

// PeerJS Server
const peerServer = PeerServer({
port: PORT,
path: ‘/peerjs’,
proxied: true,
allow_discovery: false,
cleanup_out_msgs: 1000,
alive_timeout: 60000,
key: ‘vault’,
ssl: {},
generateClientId: () => {
const chars = ‘abcdefghijklmnopqrstuvwxyz0123456789’;
let id = ‘’;
for (let i = 0; i < 16; i++) id += chars[Math.floor(Math.random() * chars.length)];
return id;
}
});

peerServer.on(‘connection’, client => {
console.log(`Client connected: ${client.getId()}`);
});

peerServer.on(‘disconnect’, client => {
console.log(`Client disconnected: ${client.getId()}`);
});

console.log(`🔒 VAULT CHAT P2P Server läuft auf Port ${PORT}`);
console.log(`🔗 PeerJS Endpoint: /peerjs`);
