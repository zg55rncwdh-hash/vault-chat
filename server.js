const WebSocket = require(‘ws’);
const http = require(‘http’);

let iceServers = [
{urls:‘stun:stun.relay.metered.ca:80’},
{urls:‘turn:global.relay.metered.ca:80’,username:‘e0b167a936e336520543b014’,credential:‘5vmFnvfsAOm4rrsd’},
{urls:‘turn:global.relay.metered.ca:80?transport=tcp’,username:‘e0b167a936e336520543b014’,credential:‘5vmFnvfsAOm4rrsd’},
{urls:‘turn:global.relay.metered.ca:443’,username:‘e0b167a936e336520543b014’,credential:‘5vmFnvfsAOm4rrsd’},
{urls:‘turns:global.relay.metered.ca:443?transport=tcp’,username:‘e0b167a936e336520543b014’,credential:‘5vmFnvfsAOm4rrsd’}
];

// Fetch fresh ICE servers from Metered API
async function refreshIceServers() {
try {
const https = require(‘https’);
const url = ‘https://vaul12.metered.live/api/v1/turn/credentials?apiKey=940f57ee6941e7021db2acee3e2a6f873519’;
https.get(url, (res) => {
let data = ‘’;
res.on(‘data’, chunk => data += chunk);
res.on(‘end’, () => {
const servers = JSON.parse(data);
if (Array.isArray(servers) && servers.length > 0) {
iceServers = servers;
console.log(‘ICE Servers refreshed:’, servers.length);
}
});
});
} catch(e) {
console.log(‘ICE refresh failed, using defaults’);
}
}

refreshIceServers();
setInterval(refreshIceServers, 60 * 60 * 1000); // refresh every hour

const server = http.createServer((req, res) => {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
if (req.url === ‘/ice’) {
res.writeHead(200, {‘Content-Type’:‘application/json’});
res.end(JSON.stringify(iceServers));
return;
}
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
