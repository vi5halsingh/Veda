require("dotenv").config();
const app = require("./app");
const initSocketServer = require("./sockets/socket.server");
const httpServer = require("http").createServer(app);

initSocketServer(httpServer);
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try a different port or kill the process using it.`);
  } else {
    console.error('Server error:', err);
  }
});
