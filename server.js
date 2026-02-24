const WebSocket = require(‘ws’);
const http = require(‘http’);

const server = http.createServer((req, res) => {
res.writeHead(200);
res.end(‘VAULT CHAT OK’);
});

const wss = new WebSocket.Server({ server });
const peers = new Map();

wss.on(‘connection’, ws => {
const id = Math.random().toString(36).substr(2, 16);
peers.set(id, ws);
ws.send(JSON.stringify({ type: ‘ID’, id }));
console.log(‘Connected:’, id, ‘| Total:’, peers.size);

ws.on(‘message’, raw => {
try {
const msg = JSON.parse(raw);
if (msg.type === ‘SIGNAL’ && msg.to) {
const target = peers.get(msg.to);
if (target && target.readyState === 1) {
target.send(JSON.stringify({ type: ‘SIGNAL’, from: id, data: msg.data }));
}
}
} catch(e) {}
});

ws.on(‘close’, () => {
peers.delete(id);
console.log(‘Disconnected:’, id, ‘| Total:’, peers.size);
});

ws.on(‘error’, () => peers.delete(id));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(’VAULT CHAT running on port ’ + PORT));
