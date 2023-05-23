import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const productSchema = new Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "Users",
    },
    itemName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    property1: {
      type: String,
    },
    property2: {
      type: String,
    },
    property3: {
      type: String,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      default: "download.jpeg",
      required: true,
    },
    bidId: {
      type: [mongoose.Types.ObjectId],
      ref: "Users",
    },
    paymentBy: {
      type: mongoose.Types.ObjectId,
      ref: "Users",
      // default: Date.now,
    },
    review: {
      type: Boolean,
    },
  },
  { timestamps: true }
);
export default model("Products", productSchema);
