import { Router } from "express";
const route = Router();
import { v4 as uuidv4 } from "uuid";
import path from "path";

import multer from "multer";
import { fileURLToPath } from "url";
import {
  createProduct,
  getProduct,
  getProductsWonByBidders,
  getReviewProduct,
  getSpecificProduct,
  placeBid,
  showWinnerProducts,
} from "../controller/productController.js";
// import { verification } from "../controllers/verification.js";
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

route.post("/createProduct", upload.single("image"), createProduct);

route.get("/getProduct", getProduct);

route.post("/specificProduct", getSpecificProduct);
route.post("/placeBid", placeBid);
route.post("/getBidWinnerProducts", showWinnerProducts);
route.get("/getProductsWonByBidders", getProductsWonByBidders);
route.post("/reviewProducts", getReviewProduct);
export default route;
