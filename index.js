import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import globalErrHandler from "./utils/errorController.js";
import dotenv from "dotenv";
import AppError from "./utils/appError.js";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import cron from "node-cron";
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);
dotenv.config();
const PORT = 5000;
const app = express();
app.use(express.json());
app.use(express.text());
app.use((error, req, res, next) => {
  console.log("This is the rejected field ->", error.field);
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "uploads")));
mongoose
  .connect(process.env.LOCAL_DATABASE)
  .then(() => console.log("db connected"))
  .catch((err) => console.error(err));

import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import messageRoutes from "./routes/message.routes.js";
import messageModal from "./model/messageModal.js";

var corsOptions = {
  origin: "http://localhost:3000",
};
app.use(cors());
app.use("/api/user", userRoutes);
app.use("/api/product", productRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/message", messageRoutes);
app.use("/*", (req, res, next) => {
  const err = new AppError(404, "fail", "undefined route");
  next(err, req, res, next);
});
app.use(globalErrHandler);
// Define the cron job
// cron.schedule("* * * * *", async () => {
//   try {
//     const currentDate = new Date();
//     // Find the product where the end date is less than the current date and status is not 'ended'
//     const product = await productModel.find({
//       endDate: { $lt: currentDate },
//       status: { $ne: "ended" },
//     });
//     if (product.length > 0) {
//       // Update the status of each task to 'overdue'
//       await productModel.updateMany(
//         {
//           _id: { $in: product.map((pid) => pid._id) },
//         },
//         { status: "ended" }
//       );

//       console.log("Product status updated ");
//     }
//   } catch (error) {
//     console.error("An error occurred:", error);
//   }
// });

// Start the cron job
// cron.start();

const httpServer = createServer(app);
const io = new Server(
  httpServer,
  //   {
  //   // origin: "http://localhost:4000",
  //   origin: "http://localhost:4000",
  //   methods: ["GET", "POST"],
  //   allowedHeaders: ["my-custom-header"],
  //   credentials: true,
  // }
  { cors: { origin: [process.env.BASEURL] } }
);
let users = [];

const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
  console.log(users);
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};
const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};
httpServer.listen(process.env.PORT || PORT, () => {
  //4000
  console.log("server listening on 5000");
});
io.on("connection", (socket) => {
  console.log("User Connected ===>" + socket.id);
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
  });

  socket.on("sendMsg", async (data) => {
    const { senderId, receiverId, text } = data;
    const conversation = await messageModal
      .findOne({
        users: { $all: [senderId, receiverId] },
      })
      .populate({
        path: "messages.sender",
        select: "username image",
      });
    let result = null;
    if (conversation) {
      // Add the new message to the conversation
      conversation.messages.push({
        sender: senderId,
        text,
      });
      //add unseen message if user not connected to socket
      const user = getUser(receiverId);
      if (!user) {
        conversation.unseenMsgs.forEach((item, index) => {
          if (item.user == receiverId) {
            conversation.unseenMsgs[index].noMsg =
              (conversation.unseenMsgs[index].noMsg || 0) + 1;
          }
        });
      } else {
        conversation.unseenMsgs.forEach((item, index) => {
          if (item.user == receiverId) {
            conversation.unseenMsgs[index].noMsg = 0;
          }
        });
      }
      result = await conversation.save();
      await result.populate("messages.sender", "username image");
    } else {
      const user = getUser(receiverId);

      const unseenMsgs = user
        ? [
            { user: receiverId, noMsg: 0 },
            { user: senderId, noMsg: 0 },
          ]
        : [
            { user: receiverId, noMsg: 1 },
            { user: senderId, noMsg: 0 },
          ];

      const newConversation = new messageModal({
        users: [senderId, receiverId],
        messages: [{ text: text, sender: senderId }],
        unseenMsgs: unseenMsgs,
      });

      result = await newConversation.save();
      await result.populate("messages.sender", "username image");
    }
    const user = getUser(receiverId);
    if (user) {
      io.to(user?.socketId).emit("getMessage", {
        // for recieving message
        newMessages: result,
      });
    }
    const user1 = getUser(senderId); // for those user who send the message
    io.to(user1?.socketId).emit("getMessage", {
      newMessages: result,
    });
  });

  //when disconnect
  socket.on("disconnect", () => {
    console.log("a user disconnected!");
    removeUser(socket.id);
  });
});
// app.listen(process.env.PORT || PORT, () => {
//   console.log("Server start on port " + PORT);
// });
