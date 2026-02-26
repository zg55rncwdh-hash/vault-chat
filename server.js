const WebSocket = require(‘ws’);
const http = require(‘http’);

const server = http.createServer((req, res) => {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.writeHead(200);
res.end(‘VAULT CHAT OK’);
});

const wss = new WebSocket.Server({ server });
const rooms = new Map();

const ipRooms = new Map();

wss.on(‘connection’, (ws, req) => {
let roomId = null;
let role = null;
const ip = req.headers[‘x-forwarded-for’] || req.socket.remoteAddress;

ws.on(‘message’, raw => {
try {
const msg = JSON.parse(raw);

```
  if (msg.type === 'CREATE') {
    // Rate limiting: max 10 rooms per IP per hour
    const now = Date.now();
    if (!ipRooms.has(ip)) ipRooms.set(ip, []);
    const times = ipRooms.get(ip).filter(t => now - t < 3600000);
    if (times.length >= 10) {
      ws.send(JSON.stringify({type:'ERROR', msg:'Zu viele Räume erstellt. Bitte warte.'}));
      return;
    }
    times.push(now);
    ipRooms.set(ip, times);
    const arr = new Uint8Array(16);
    require('crypto').randomFillSync(arr);
    roomId = Array.from(arr).map(b => b.toString(36)).join('').substr(0, 16);
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
