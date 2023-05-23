import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const bidSchema = new Schema({
  userId: { type: mongoose.Types.ObjectId, ref: "Users" },
  price: { type: Number },
  timestamp: { type: Date, default: Date.now },
});
export default model("Bid", bidSchema);
