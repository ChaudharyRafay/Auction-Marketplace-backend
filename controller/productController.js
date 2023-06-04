// import productModel from "../model/productModel.js";
import bidModel from "../model/bidModel.js";
import productModel from "../model/productModel.js";
import userModel from "../model/userModel.js";
import catchAsync from "../utils/catchAsync.js";

export const createProduct = catchAsync(async (req, res, next) => {
  try {
    console.log(req.file);
    if (req.file) {
      let data = {
        itemName: req.body.itemName,
        description: req.body.description,
        property1: req.body.property1,
        property2: req.body.property2,
        property3: req.body.property3,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        price: req.body.price,
        image: req.file?.filename,
        userId: req.body.userId,
      };
      const result = await productModel.create(data);
      if (result) {
        return res.status(200).json({
          message: "product created successfully!!",
        });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.stack });
  }
});
export const deleteProduct = catchAsync(async (req, res, next) => {
  try {
    console.log(req.body);
    const result = await productModel.findOneAndDelete(
      { _id: req.body.productId },
      { new: true }
    );
    if (result) {
      res.status(200).json();
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.stack });
  }
});
export const getProduct = catchAsync(async (req, res, next) => {
  try {
    const currentDate = new Date();
    const liveAuction = await productModel.find({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    const sortedLiveAuction = liveAuction.sort((a, b) => {
      const numBidsA = a.bidId.length;
      const numBidsB = b.bidId.length;
      return numBidsB - numBidsA;
    });

    const endAuction = await productModel.find({
      startDate: { $lt: currentDate },
      endDate: { $lt: currentDate },
    });

    if (liveAuction && endAuction) {
      res
        .status(200)
        .json({ endAuction, liveAuction, trendingAuction: sortedLiveAuction });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.stack });
  }
});

export const getSpecificProduct = catchAsync(async (req, res, next) => {
  try {
    const result = await productModel.findOne({
      _id: req.body.productId,
    });
    // Check if product auction has ended
    const currentDate = new Date();
    if (result.startDate < currentDate && result.endDate < currentDate) {
      // Auction has ended, calculate the winner
      if (result.bidId.length) {
        const bids = await bidModel
          .find({ _id: { $in: result.bidId } })
          .populate("userId", { username: 1, image: 1 })
          .sort({ price: -1 }); // Sort bids in descending order of price
        // .limit(1); // Get the highest bid (winner)
        if (bids.length > 0) {
          res.status(200).json({
            product: result,
            winner: bids[0],
            bids,
            auction: "expireWinner",
          });
        }
      } else {
        // No bids, no winner
        res
          .status(200)
          .json({ product: result, winner: [], auction: "expire" });
      }
    } else {
      // Auction is still ongoing, send the product details
      const bids = await bidModel
        .find({ _id: { $in: result.bidId } })
        .populate("userId", { username: 1, image: 1 });
      if (bids) {
        res.status(200).json({ product: result, bids, auction: "ongoing" });
      } else {
        res.status(200).json({ product: result, bids: [], auction: "ongoing" });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.stack });
  }
});

export const placeBid = catchAsync(async (req, res, next) => {
  const { productId, userId, price } = req.body;
  if (productId && userId && price) {
    try {
      const product = await productModel.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const existingBid = await bidModel.findOne({
        userId,
        _id: { $in: product.bidId },
      });
      if (existingBid) {
        // User has already placed a bid on this product
        const highestBid = await bidModel
          .findOne({ _id: { $in: product.bidId } })
          .sort({ price: -1 });
        if (price <= highestBid.price) {
          return res
            .status(400)
            .json({ message: "Your bid price is lower than the highest bid" });
        }

        const updatedBid = await bidModel.findOneAndUpdate(
          { _id: existingBid._id },
          { price },
          { new: true }
        );
        if (updatedBid) {
          return res.status(200).json({
            product: updatedBid,
            message: "Congratulations! Your bid has been updated successfully.",
          });
        }
      } else {
        // User has not placed a bid on this product yet
        const highestBid = await bidModel
          .findOne({ _id: { $in: product.bidId } })
          .sort({ price: -1 });
        if (highestBid) {
          if (price <= highestBid.price) {
            return res.status(400).json({
              message: "Your bid price is lower than the highest bid",
            });
          }
        } else {
          if (price <= product.price) {
            return res.status(400).json({
              message: "Your bid price is lower than the highest bid",
            });
          }
        }

        const newBid = await bidModel.create({ userId, price });
        await productModel.findByIdAndUpdate(productId, {
          $push: { bidId: newBid._id },
        });

        return res.status(200).json({
          product: newBid,
          message: "Congratulations! Your bid has been placed successfully.",
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
});

export const getProductsWonByBidders = async (req, res) => {
  try {
    const currentDate = new Date();

    // Find products whose auction can be ended
    const products = await productModel.find({
      startDate: { $lt: currentDate },
      endDate: { $lt: currentDate },
    });

    // Fetch the winning bids for each product
    const productIds = products.map((product) => product._id);
    const winningBids = await productModel
      .find({
        _id: { $all: productIds },
        bidId: { $exists: true, $ne: [] },
      })
      .populate({
        path: "bidId",
        populate: { path: "userId", select: "name email" }, // Assuming your user reference field in the Bid model is named "userId"
        options: { sort: { price: -1 }, limit: 1 },
      })
      .lean();
    console.log(winningBids);
    // Combine products with winning bids
    const productsWithWinningBids = products.map((product) => {
      const winningBid = winningBids.find(
        (bid) => bid._id.toString() === product._id.toString()
      ).bidId[0];

      return {
        product,
        winningBid,
      };
    });

    res.status(200).json(productsWithWinningBids);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// export const showWinnerProducts = catchAsync(async (req, res, next) => {
//   try {
//     const { userId } = req.body;
//     const result = await productModel.find({
//       userId: { $ne: userId },
//       bidId: userId,
//     });
//     console.log(result);
//     if (result.length) {
//       //  Check if product auction has ended
//       const currentDate = new Date();
//       if (result.startDate < currentDate && result.endDate < currentDate) {
//         // Auction has ended, calculate the winner
//         if (result.bidId.length) {
//           const bids = await bidModel
//             .find({ _id: { $in: result.bidId } })
//             .populate("userId", { username: 1, image: 1 })
//             .sort({ price: -1 }); // Sort bids in descending order of price
//           // .limit(1); // Get the highest bid (winner)
//           if (bids.length > 0) {
//             const winner = bids[0];
//             if (winner._id === userId) {
//               //winner is me
//               res.status(200).json({
//                 product: result,
//                 winner: bids[0],
//                 success: true,
//                 // auction: "expireWinner",
//               });
//             } else {
//               res.status(200).json({
//                 //winner is someOne else
//                 product: result,
//                 winner: bids[0],
//                 success: false,
//                 // auction: "expireWinner",
//               });
//             }
//           }
//         }
//       } else {
//         // Auction is still ongoing, send the product details
//         const bids = await bidModel
//           .find({ _id: { $in: result.bidId } })
//           .populate("userId", { username: 1, image: 1 });
//         if (bids) {
//           res.status(200).json({ product: result, bids, status: "ongoing" });
//         } else {
//           res
//             .status(200)
//             .json({ product: result, bids: [], status: "ongoing" });
//         }
//       }
//     } else {
//       res.status(200).json({ message: "Not found" });
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: error.stack });
//   }
// });
export const showWinnerProducts = catchAsync(async (req, res, next) => {
  try {
    const { userId } = req.body;

    // Step 1: Find products whose userId is not equal to the provided userId
    const products = await productModel.find({
      userId: { $ne: userId },
    });
    const winners = [];
    const pendingBid = [];
    if (products.length > 0) {
      // Step 2: Check if auction has ended and calculate winner for each product
      const currentDate = new Date();

      for (const product of products) {
        if (product.startDate < currentDate && product.endDate < currentDate) {
          // Auction has ended, calculate the winner
          if (product.bidId.length) {
            const bids = await bidModel
              .find({ _id: { $in: product.bidId } })
              .populate("userId", { username: 1, image: 1 })
              .sort({ price: -1 }); // Sort bids in descending order of price

            if (bids.length > 0) {
              const winner = bids[0];

              if (winner.userId._id.toString() === userId) {
                // Winner's _id matches the userId
                winners.push(product);
              }
            }
          }
        } else {
          // Auction still ongoing and user already participate auction
          if (product.bidId.length) {
            const bids = await bidModel
              .find({ _id: { $in: product.bidId } })
              .sort({ price: -1 }); // Sort bids in descending order of price;
            if (bids.length > 0) {
              const filteredArray = bids.filter((obj) => obj.userId == userId);
              if (filteredArray.length) {
                pendingBid.push(product);
              }
            }
          }
        }
      }
    } else {
      // Step 3: No products found in the first condition
      return res.status(200).json({
        message: "No product found",
        products: [],
        pendingProducts: [],
      });
    }

    if (winners.length > 0 || pendingBid.length > 0) {
      res.status(200).json({
        products: winners,
        pendingProducts: pendingBid,
        success: true,
      });
    } else {
      res.status(200).json({
        products: [],
        pendingProducts: [],
        success: false,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.stack });
  }
});
export const getReviewProduct = catchAsync(async (req, res, next) => {
  try {
    const reviewProduct = await productModel.find({
      paymentBy: req.body.userId,
      review: false,
    });
    if (reviewProduct) {
      res.status(200).json({ reviewProduct });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.stack });
  }
});
