import catchAsync from "../utils/catchAsync.js";

import { config } from "dotenv";
import reviewModel from "../model/reviewModel.js";
import productModel from "../model/productModel.js";
config();

export const createReview = catchAsync(async (req, res, next) => {
  const { userId, productId, rating, name, review } = req.body;
  try {
    let body = {
      userId,
      productId,
      rating,
      name,
      text: review,
    };
    const result = await reviewModel.create(body);
    if (result) {
      const result1 = await productModel.findOneAndUpdate(
        { _id: productId },
        { $set: { review: true } },
        { new: true }
      );
      if (result1) {
        return res.status(200).json({ success: "true" });
      }
    }
  } catch (error) {
    console.log(error.stack);
    return res.status(500).json({
      success: false,
      error,
    });
  }
});

export const getReviews = catchAsync(async (req, res, next) => {
  try {
    const result = await reviewModel
      .find()
      .populate({
        path: "productId",
        match: { userId: req.body.userId }, // Apply the condition to match the userId
        select: { itemName: 1, image: 1, bidId: 1 },
      })
      .populate("userId", { username: 1, image: 1 }) // Add another populate for the userId field
      .exec();
    const filteredResult = result.filter((review) => review.productId !== null);
    console.log(filteredResult);
    if (result.length) {
      return res.status(200).json({ reviews: filteredResult });
    }
  } catch (error) {
    console.log(error.stack);
    return res.status(500).json({
      success: false,
      error,
    });
  }
});
