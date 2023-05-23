import { Router } from "express";
const route = Router();
import {
  SignUpEmail,
  SignUpPhone,
  getProfile,
  getUserProduct,
  // loginEmail,
  loginUser,
  setting,
  updateProfileImage,
  userProfile,
  verifyAccount,
} from "../controller/userController.js";
import {
  authenticateUser,
  createPayment,
} from "../controller/paymentController.js";

// import auth from "../middleware/auth.js";

route.post("/createpayment", createPayment);
route.post("/authenticateUser", authenticateUser);
export default route;
