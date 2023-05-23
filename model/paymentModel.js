import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const paymentSchema = new Schema({
  productId: { type: mongoose.Types.ObjectId, ref: "Products" },
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String },
  expireDate: { type: String },
  CVC: { type: Number },
  cardNo: { type: String },
  paymentMethod: { type: String },
  timestamp: { type: Date, default: Date.now },
});
export default model("Payment", paymentSchema);
