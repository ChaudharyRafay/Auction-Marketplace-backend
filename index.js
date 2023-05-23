import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import globalErrHandler from "./utils/errorController.js";
import dotenv from "dotenv";
import AppError from "./utils/appError.js";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
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
  .connect(process.env.DATABASE)
  .then(() => console.log("db connected"))
  .catch((err) => console.error(err));

import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import productModel from "./model/productModel.js";
var corsOptions = {
  origin: "http://localhost:3000",
};
app.use(cors());
app.use("/api/user", userRoutes);
app.use("/api/product", productRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/review", reviewRoutes);
app.use("/*", (req, res, next) => {
  const err = new AppError(404, "fail", "undefined route");
  next(err, req, res, next);
});
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
app.use(globalErrHandler);
app.listen(process.env.PORT || PORT, () => {
  console.log("Server start on port " + PORT);
});
