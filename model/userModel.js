import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
    },
    phone: {
      type: Number,
      //   required: true,
    },
    email: {
      type: String,
      //   required: true,
    },
    password: {
      type: String,
      required: true,
    },
    verify: {
      type: Boolean,
      required: true,
      default: false,
    },
    image: {
      type: String,
      default: "download.jpeg",
    },
    coverPhoto: {
      type: String,
    },
    twitter: {
      type: String,
    },
    facebook: {
      type: String,
    },
    discord: {
      type: String,
    },
    bioDetail: {
      type: String,
    },
  },
  { timestamps: true }
);
export default model("Users", userSchema);
