import { Router } from "express";
const route = Router();
import {
  getMessages,
  getrecentChat,
  seenMessages,
} from "../controller/messageController.js";

route.post("/getMessage", getMessages);
route.post("/getRecentChat", getrecentChat);
route.post("/seenMessages", seenMessages);
export default route;
