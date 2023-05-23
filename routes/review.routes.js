import { Router } from "express";
const route = Router();
import { createReview, getReviews } from "../controller/reviewController.js";

// import auth from "../middleware/auth.js";

route.post("/createReview", createReview);
route.post("/getPendingReviewsProduct", createReview);
route.post("/getReview", getReviews);
export default route;
