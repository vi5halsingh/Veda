require("dotenv").config();
const app = require("./app");
const initSocketServer = require("./sockets/socket.server");
const httpServer = require("http").createServer(app);

initSocketServer(httpServer);
httpServer.listen(3000, () => {
  console.log(`server is running on port ${3000} `);
});
