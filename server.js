const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { WebSocketServer, WebSocket } = require('ws');
const QRCode = require('qrcode');

const PORT = process.env.PORT || 8080;

// Tipos MIME para arquivos estáticos
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

// Detecção inteligente do IP local da máquina (para exibição no QR Code / mobile)
function getLocalIp() {
  if (process.env.HOST_IP) {
    return process.env.HOST_IP;
  }
  const interfaces = os.networkInterfaces();
  const candidates = [];
  
  for (const name of Object.keys(interfaces)) {
    const isVirtual = /vethernet|docker|wsl|loopback|virtual/i.test(name);
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (!isVirtual) {
          candidates.unshift(iface.address);
        } else {
          candidates.push(iface.address);
        }
      }
    }
  }
  return candidates[0] || '192.168.0.8';
}

// Servidor HTTP
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = parsedUrl.pathname;

  // Endpoint de informações de rede (IP do host)
  if (pathname === '/api/network-info') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ip: getLocalIp(),
      port: PORT,
      hostUrl: `http://${getLocalIp()}:${PORT}`
    }));
    return;
  }

  // Endpoint gerador de QR Code em SVG vetorial
  if (pathname === '/api/qr') {
    const text = parsedUrl.searchParams.get('text') || '';
    QRCode.toString(text, { type: 'svg', margin: 1, color: { dark: '#ffffff', light: '#181a1f' } }, (err, svg) => {
      if (err) {
        res.writeHead(500);
        res.end('Erro ao gerar QR');
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache'
      });
      res.end(svg);
    });
    return;
  }

  // Roteamento amigável
  if (pathname === '/' || pathname === '/index.html') {
    pathname = '/index.html';
  } else if (pathname === '/join' || pathname === '/join/') {
    pathname = '/join.html';
  }

  const filePath = path.join(__dirname, pathname);

  // Segurança para evitar directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Acesso proibido');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Página ou arquivo não encontrado');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

// Gerenciamento de Salas em Memória
// PIN -> { pin, hostWs, players: Map(id -> { id, name, emoji, ws }), state: 'idle'|'spinning' }
const rooms = new Map();

function generatePin() {
  let pin;
  do {
    pin = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms.has(pin));
  return pin;
}

// Servidor WebSocket
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  let clientRole = null; // 'host' ou 'player'
  let clientPin = null;
  let playerId = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // --- MENSAGENS DO APRESENTADOR (HOST) ---
      if (data.type === 'host:create_room') {
        const pin = generatePin();
        clientRole = 'host';
        clientPin = pin;

        rooms.set(pin, {
          pin,
          hostWs: ws,
          players: new Map(),
          state: 'idle',
          currentWinner: null
        });

        // Determina o host/IP da rota de conexão para os celulares
        let resolvedHost = process.env.HOST_IP || '192.168.0.8';
        if (data.customHost) {
          resolvedHost = data.customHost;
        } else if (data.clientOrigin && !data.clientOrigin.includes('localhost') && !data.clientOrigin.includes('127.0.0.1') && !data.clientOrigin.includes('172.')) {
          try {
            resolvedHost = new URL(data.clientOrigin).host;
          } catch (e) {}
        } else {
          const detected = getLocalIp();
          if (detected && !detected.startsWith('172.') && detected !== 'localhost') {
            resolvedHost = detected;
          }
        }

        if (!resolvedHost.includes(':')) {
          resolvedHost = `${resolvedHost}:${PORT}`;
        }

        const joinUrl = `http://${resolvedHost}/join?pin=${pin}`;

        ws.send(JSON.stringify({
          type: 'host:room_created',
          pin,
          hostAddress: resolvedHost,
          joinUrl
        }));
        console.log(`[SESSÃO] Nova sala criada com PIN: ${pin} | Rota: ${joinUrl}`);
      }

      else if (data.type === 'host:spin_start') {
        const room = rooms.get(clientPin);
        if (room && room.hostWs === ws) {
          room.state = 'spinning';
          // Notifica todos os participantes conectados
          const payload = JSON.stringify({ type: 'game:spinning' });
          for (const player of room.players.values()) {
            if (player.ws.readyState === WebSocket.OPEN) {
              player.ws.send(payload);
            }
          }
        }
      }

      else if (data.type === 'host:spin_end') {
        const room = rooms.get(clientPin);
        if (room && room.hostWs === ws) {
          room.state = 'idle';
          const winnerData = data.winner || {}; // { name, emoji }
          room.currentWinner = winnerData;
          const rawWinnerName = (winnerData.name || '').trim().toLowerCase();

          for (const [pId, player] of room.players.entries()) {
            if (player.ws.readyState === WebSocket.OPEN) {
              const fullFormatted = `${player.emoji} ${player.name}`.trim().toLowerCase();
              const isWinner = (player.name.toLowerCase() === rawWinnerName) ||
                               (fullFormatted === rawWinnerName) ||
                               (rawWinnerName.endsWith(player.name.toLowerCase()));

              player.ws.send(JSON.stringify({
                type: isWinner ? 'game:you_won' : 'game:winner_announced',
                winner: winnerData,
                roomPin: room.pin
              }));
            }
          }
        }
      }

      else if (data.type === 'host:remove_player') {
        const room = rooms.get(clientPin);
        if (room && room.hostWs === ws) {
          const targetPlayer = room.players.get(data.playerId);
          if (targetPlayer) {
            if (targetPlayer.ws.readyState === WebSocket.OPEN) {
              targetPlayer.ws.send(JSON.stringify({
                type: 'player:removed',
                reason: 'Removido pelo apresentador'
              }));
            }
            room.players.delete(data.playerId);
            // Confirma para o host
            ws.send(JSON.stringify({
              type: 'host:player_removed',
              playerId: data.playerId
            }));
          }
        }
      }

      // --- MENSAGENS DO PARTICIPANTE (MOBILE PLAYER) ---
      else if (data.type === 'player:join') {
        const pin = (data.pin || '').replace(/\s+/g, '');
        const room = rooms.get(pin);

        if (!room) {
          ws.send(JSON.stringify({
            type: 'player:join_error',
            message: 'Código PIN inválido ou sessão não encontrada.'
          }));
          return;
        }

        const cleanName = (data.name || '').trim();
        if (!cleanName || cleanName.length < 1 || cleanName.length > 25) {
          ws.send(JSON.stringify({
            type: 'player:join_error',
            message: 'Por favor, digite um nome válido (1 a 25 caracteres).'
          }));
          return;
        }

        const cleanEmoji = (data.emoji || '🎯').trim();
        playerId = 'p_' + Math.random().toString(36).substring(2, 9);
        clientRole = 'player';
        clientPin = pin;

        const newPlayer = {
          id: playerId,
          name: cleanName,
          emoji: cleanEmoji,
          ws,
          joinedAt: Date.now()
        };

        room.players.set(playerId, newPlayer);

        // Responde ao jogador confirmando entrada
        ws.send(JSON.stringify({
          type: 'player:joined_success',
          player: { id: playerId, name: cleanName, emoji: cleanEmoji },
          roomPin: pin
        }));

        // Notifica o host no telão
        if (room.hostWs && room.hostWs.readyState === WebSocket.OPEN) {
          room.hostWs.send(JSON.stringify({
            type: 'host:player_joined',
            player: { id: playerId, name: cleanName, emoji: cleanEmoji },
            totalPlayers: room.players.size
          }));
        }
        console.log(`[JOGADOR] ${cleanEmoji} ${cleanName} entrou na sala ${pin}`);
      }

    } catch (e) {
      console.error('[ERRO WS]', e);
    }
  });

  ws.on('close', () => {
    if (clientRole === 'host' && clientPin) {
      const room = rooms.get(clientPin);
      if (room) {
        // Notifica jogadores que o host encerrou a sessão
        const payload = JSON.stringify({ type: 'game:session_ended', message: 'A sessão foi encerrada pelo apresentador.' });
        for (const player of room.players.values()) {
          if (player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(payload);
          }
        }
        rooms.delete(clientPin);
        console.log(`[SESSÃO] Sala ${clientPin} encerrada.`);
      }
    } else if (clientRole === 'player' && clientPin && playerId) {
      const room = rooms.get(clientPin);
      if (room && room.players.has(playerId)) {
        const removed = room.players.get(playerId);
        room.players.delete(playerId);
        if (room.hostWs && room.hostWs.readyState === WebSocket.OPEN) {
          room.hostWs.send(JSON.stringify({
            type: 'host:player_left',
            playerId,
            name: removed.name,
            emoji: removed.emoji,
            totalPlayers: room.players.size
          }));
        }
      }
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log(`====================================================`);
  console.log(`  ROLETA ZAPPCOM - SERVIDOR MULTIPLAYER (KAHOOT STYLE)`);
  console.log(`====================================================`);
  console.log(`  Telão (Apresentador): http://localhost:${PORT}`);
  console.log(`  Mobile (Participante): http://${localIp}:${PORT}/join`);
  console.log(`====================================================`);
});
