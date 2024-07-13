const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const pty = require('node-pty');
const minimist = require('minimist');

// Buat aplikasi Express
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Tentukan port
const args = minimist(process.argv.slice(2));
const PORT = args.port || process.env.PORT || 3000;

// Gunakan folder public untuk file statis
app.use(express.static('public'));

// Handle koneksi socket.io
io.on('connection', (socket) => {
  console.log('Client connected');

  // Buat sesi terminal
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env
  });

  // Kirim data dari PTY ke client
  ptyProcess.on('data', (data) => {
    socket.emit('output', data);
  });

  // Terima data dari client dan kirim ke PTY
  socket.on('input', (input) => {
    ptyProcess.write(input);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    ptyProcess.kill();
    console.log('Client disconnected');
  });
});

// Mulai server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
