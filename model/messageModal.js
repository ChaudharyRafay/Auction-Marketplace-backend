import mongoose, { model } from "mongoose";
const ChatMessageSchema = new mongoose.Schema({
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
  messages: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
      text: { type: String },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  unseenMsgs: [
    {
      user: { type: mongoose.Schema.Types.ObjectId },
      noMsg: { type: Number, default: 0 },
    },
  ],
  timestamp: {
    type: Date,
    default: Date.now,
  },
});
export default model("Conversation", ChatMessageSchema);
