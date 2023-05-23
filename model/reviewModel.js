import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const reviewSchema = new Schema({
  productId: { type: mongoose.Types.ObjectId, ref: "Products", required: true },
  userId: { type: mongoose.Types.ObjectId, ref: "Users", required: true },
  name: { type: String, required: true },
  text: { type: String, required: true },
  rating: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});
export default model("Review", reviewSchema);
