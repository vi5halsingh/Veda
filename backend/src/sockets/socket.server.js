const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const aiservice = require("../services/ai.service");
const messageModel = require("../models/message.model");
const { createMemory, queryMemory } = require("../services/vector.services");
const { model } = require("mongoose");

async function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

    if (!cookies.token) {
      return next(new Error("Unauthorized: No token provided"));
    }
    try {
      const decode = jwt.decode(cookies.token, process.env.JWT_SECRET);
      const user = await userModel.findById(decode.id);
      if (!user) {
        return next(new Error("Unauthorized: User not found"));
      }
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Invalid token provided"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("ai-message", async (messagePayload) => {
      // Immediately notify the client that the AI is "typing"
      socket.emit("typing-start");

      let user = socket.user;
      // console.log(user);

      // Check if the token reset time has passed
      // if (new Date() > user.tokenResetAt) {
      //   user.tokenLimit = 30;
      //   user.tokenResetAt = new Date(
      //     new Date().getTime() + 24 * 60 * 60 * 1000
      //   );
      //   await user.save();
      // }
      socket.emit('tokenLimit',user.tokenLimit)
      if (user.tokenLimit <= 0) {
        socket.emit("token-limit-exceeded", user.tokenLimit);
        return;
      }

      const [message, vector] = await Promise.all([
        messageModel.create({
          user: socket.user._id,
          chat: messagePayload.chat,
          content: messagePayload.content,
          role: "user",
        }),
        aiservice.generateVector(messagePayload.content),
      ]);

      const chatmemory = await queryMemory({
        queryVector: vector,
        limit: 3,
        metadata: {},
      });

      const ltm = [
        {
          role: "user",
          parts: [
            {
              text: `these are some previous message from the chat, use them to generate a response ${chatmemory
                .map((item) => item.metadata.text)
                .join("/n")}`,
            },
          ],
        },
      ];

      await createMemory({
        vector,
        messageId: message._id,
        metadata: {
          chat: messagePayload.chat,
          user: socket.user._id,
          text: messagePayload.content,
        },
      });

      const chatHistory = (
        await messageModel
          .find({ chat: messagePayload.chat })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean()
      ).reverse();

      const stm = chatHistory.map((item) => {
        return {
          role: item.role,
          parts: [{ text: item.content }],
        };
      });
      try {
        const response = await aiservice.generateResponse([...ltm, ...stm], {
          model: messagePayload.model,
          temperature: messagePayload.temperature,
          role: messagePayload.role,
        });

        console.log(response);

        const [responseVector, responseMessage] = await Promise.all([
          aiservice.generateVector(response),
          messageModel.create({
            user: socket.user._id,
            chat: messagePayload.chat,
            content: response,
            role: "model",
          }),
        ]);
        await createMemory({
          vector: responseVector,
          messageId: responseMessage._id,
          metadata: {
            chat: messagePayload.chat,
            user: socket.user._id,
            text: response,
          },
        });
        socket.emit("ai-response", {
          content: response,
          chat: messagePayload.chat,
        });

        // Decrement token limit and save the user
        user.tokenLimit -= 1;

        await user.save();
      } catch (error) {
        socket.emit("ai-error", {
          message: "Failed to get a response from Veda-AI.",
        });
      }
    });
  });
}

module.exports = initSocketServer;
