import { Router } from "express";
const route = Router();
import {
  ContactUs,
  SignUpEmail,
  SignUpPhone,
  getProfile,
  getUserProduct,
  // loginEmail,
  loginUser,
  sendCodePhone,
  sendEmail,
  setting,
  updateEmail,
  updatePhoneNumber,
  updateProfileImage,
  userProfile,
  verifyAccount,
} from "../controller/userController.js";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";

// import multer from "multer";
import { fileURLToPath } from "url";
// // import { verification } from "../controllers/verification.js";
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + "-" + Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

let upload = multer({ storage, fileFilter });
// import auth from "../middleware/auth.js";

route.post("/SignUp/Email", SignUpEmail);
route.post("/SignUp/phone", SignUpPhone);
route.post("/loginUser", loginUser);
route.post("/verifyAccount", verifyAccount);
route.post("/profile", getProfile);
route.post("/getUserProduct", getUserProduct);
route.post("/setting", setting);
route.post("/sendCodePhone", sendCodePhone);
route.post("/sendEmail", sendEmail);
route.post("/updatePhoneNo", updatePhoneNumber);
route.post("/updateEmail", updateEmail);
route.post("/contactUs", ContactUs);
route.post(
  "/updateCoverImage",
  upload.single("coverImage"),
  // handleFileUploadError,
  userProfile
);
route.post(
  "/updateProfileImage",
  upload.single("profileImage"),
  updateProfileImage
);

export default route;
