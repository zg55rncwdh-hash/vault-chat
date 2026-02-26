const WebSocket = require(‘ws’);
const http = require(‘http’);

const server = http.createServer((req, res) => {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.writeHead(200);
res.end(‘VAULT CHAT OK’);
});

const wss = new WebSocket.Server({ server });
const rooms = new Map();

wss.on(‘connection’, ws => {
let roomId = null;
let role = null;

ws.on(‘message’, raw => {
try {
const msg = JSON.parse(raw);

```
  if (msg.type === 'CREATE') {
    roomId = Math.random().toString(36).substr(2, 12);
    role = 'host';
    rooms.set(roomId, { host: ws, guest: null });
    ws.send(JSON.stringify({ type: 'CREATED', roomId }));
    console.log('Room created:', roomId);
  }

  if (msg.type === 'JOIN') {
    roomId = msg.roomId;
    role = 'guest';
    const room = rooms.get(roomId);
    if (!room) {
      ws.send(JSON.stringify({ type: 'ERROR', msg: 'Raum nicht gefunden' }));
      return;
    }
    room.guest = ws;
    if (room.host && room.host.readyState === 1) {
      room.host.send(JSON.stringify({ type: 'GUEST_JOINED' }));
    }
    ws.send(JSON.stringify({ type: 'JOINED' }));
    console.log('Guest joined:', roomId);
  }

  if (msg.type === 'RELAY') {
    const room = rooms.get(roomId);
    if (!room) return;
    const target = role === 'host' ? room.guest : room.host;
    if (target && target.readyState === 1) {
      target.send(JSON.stringify({ type: 'RELAY', data: msg.data }));
    }
  }

} catch(e) {}
```

});

ws.on(‘close’, () => {
if (!roomId || !rooms.has(roomId)) return;
const room = rooms.get(roomId);
const target = role === ‘host’ ? room.guest : room.host;
if (target && target.readyState === 1) {
target.send(JSON.stringify({ type: ‘PARTNER_LEFT’ }));
}
if (role === ‘host’) rooms.delete(roomId);
});

ws.on(‘error’, () => {});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(’VAULT CHAT running on port ’ + PORT));
