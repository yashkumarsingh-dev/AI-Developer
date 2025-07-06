import "dotenv/config";
import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import projectModel from "./models/project.model.js";
import { generateResult } from "./services/ai.service.js";
import Message from "./models/message.model.js";

const port = process.env.PORT || 8080;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.split(" ")[1];
    const projectId = socket.handshake.query.projectId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error("Invalid projectId"));
    }
    socket.project = await projectModel.findById(projectId);

    if (!token) {
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return next(new Error("Authentication error"));
    }

    socket.user = decoded;

    next();
  } catch (error) {
    next(error);
  }
});

io.on("connection", (socket) => {
  socket.roomId = socket.project._id.toString();

  console.log("a user connected");

  socket.join(socket.roomId);

  socket.on("project-message", async (data) => {
    const message = data.message;
    const projectId = socket.project._id;

    const aiIsPresentInMessage = message.includes("@ai");

    if (aiIsPresentInMessage) {
      const prompt = message.replace("@ai", "");
      try {
        const result = await generateResult(prompt);
        // Save AI message to DB
        await Message.create({
          projectId,
          sender: { _id: "ai", email: "AI" },
          message: result,
          timestamp: new Date(),
        });
        io.to(socket.roomId).emit("project-message", {
          message: result,
          sender: {
            _id: "ai",
            email: "AI",
          },
        });
      } catch (error) {
        let userMessage =
          "AI Error: Service unavailable. Please try again later.";
        if (error.message && error.message.includes("429 Too Many Requests")) {
          userMessage =
            "AI Error: You have exceeded your free quota for the day. Please try again later or check your API plan.";
        } else if (
          error.message &&
          error.message.includes("GoogleGenerativeAI Error")
        ) {
          userMessage =
            "AI Error: There was a problem with the AI service. Please try again later.";
        }
        // Save AI error message to DB
        await Message.create({
          projectId,
          sender: { _id: "ai", email: "AI" },
          message: userMessage,
          timestamp: new Date(),
        });
        io.to(socket.roomId).emit("project-message", {
          message: userMessage,
          sender: {
            _id: "ai",
            email: "AI",
          },
        });
      }
      return;
    }

    // Save user message to DB
    await Message.create({
      projectId,
      sender: data.sender,
      message: data.message,
      timestamp: data.timestamp || new Date(),
    });
    // For normal messages, send to everyone (including sender)
    io.to(socket.roomId).emit("project-message", data);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    socket.leave(socket.roomId);
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
