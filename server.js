const http = require('http');
const { WebSocketServer } = require('ws');
const PORT = process.env.PORT || 3000;
const rooms = new Map();
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('VAULT CHAT SERVER');
});
const wss = new WebSocketServer({ server });
wss.on('connection', (ws) => {
  let currentRoom = null;
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'JOIN') {
        currentRoom = msg.roomId;
        if (!rooms.has(currentRoom)) rooms.set(currentRoom, []);
        const room = rooms.get(currentRoom);
        if (room.length >= 2) { ws.send(JSON.stringify({ type: 'ERROR', msg: 'Raum voll' })); return; }
        room.push(ws);
        ws.send(JSON.stringify({ type: 'JOINED', role: room.length === 1 ? 'alice' : 'bob', peers: room.length }));
        if (room.length === 2) room.forEach(c => c.readyState === 1 && c.send(JSON.stringify({ type: 'PEER_JOINED' })));
        return;
      }
      if (currentRoom && rooms.has(currentRoom)) {
        rooms.get(currentRoom).forEach(c => { if (c !== ws && c.readyState === 1) c.send(data.toString()); });
      }
    } catch (e) {}
  });
  ws.on('close', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const updated = rooms.get(currentRoom).filter(c => c !== ws);
      if (updated.length === 0) rooms.delete(currentRoom);
      else { rooms.set(currentRoom, updated); updated.forEach(c => c.readyState === 1 && c.send(JSON.stringify({ type: 'PEER_LEFT' }))); }
    }
  });
  ws.on('error', () => {});
});
server.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
