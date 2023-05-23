import catchAsync from "../utils/catchAsync.js";
import bcrypt from "bcrypt";
const { hashSync } = bcrypt;
import nodemailer from "nodemailer";
import userModel from "../model/userModel.js";

import twilio from "twilio";
import { hash, check } from "../utils/crypt.js";
import jwt from "jsonwebtoken";
import { config } from "dotenv";
import crypto from "crypto";
import productModel from "../model/productModel.js";
import bidModel from "../model/bidModel.js";
import paymentModel from "../model/paymentModel.js";
config();

const emailSent = (code, email, username) => {
  const output = `
  <div style="background-color: #f5f5f5; padding: 50px;">
    <div style="background-color: #fff; padding: 50px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,.1);">
      <h1 style="font-size: 28px; margin-bottom: 30px;">Verify your Auction Marketplace account, ${username}!</h1>
      <p style="font-size: 16px;">Please use the following code to verify your account:</p>
      <div style="background-color: #f7f7f7; border-radius: 10px; padding: 20px; margin-bottom: 30px; font-size: 24px; font-weight: bold;">
        ${code}
      </div>
      <p style="font-size: 16px;">Copy and paste this code into the verification field in Auction Marketplace to complete your account verification.</p>
      <p style="font-size: 16px;">Thanks for using Auction Marketplace!</p>
    </div>
  </div>
`;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    service: "gmail",
    auth: {
      user: "rafaymuhammad245@gmail.com",
      pass: "ptcanmqgfakfebam",
    },
  });

  const mailOptions = {
    from: "your_email_address@gmail.com",
    to: email,
    subject: "Verify your Auction Marketplace account",
    html: output,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      reject(error);
    } else {
      console.log("Email sent: " + info.response);
      resolve(info.response);
    }
  });
};

export const createPayment = catchAsync(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    expireDate,
    CVC,
    cardNo,
    paymentMethod,
    productId,
    userId,
  } = req.body;
  try {
    let body = {
      firstName,
      lastName,
      email,
      expireDate,
      CVC,
      cardNo,
      paymentMethod,
      productId,
    };
    console.log(body);
    const result = await paymentModel.create(body);

    console.log(result);
    if (result) {
      const result1 = await productModel.findOneAndUpdate(
        { _id: productId },
        { $set: { paymentBy: userId, review: false } },
        { new: true }
      );
      if (result1) {
        return res.status(200).json({ success: "true" });
      }
    }
  } catch (error) {
    console.log(error);
    console.log(error.stack);
    return res.status(500).json({
      success: false,
      error,
    });
  }
});
export const authenticateUser = catchAsync(async (req, res, next) => {
  const { userId, productId } = req.body;

  try {
    const product = await productModel.findOne({
      _id: productId,
      userId: { $ne: userId },
    });

    if (!product) {
      return res.status(404).json({ winner: false });
    }

    const currentDate = new Date();

    if (product.startDate >= currentDate || product.endDate >= currentDate) {
      return res.status(404).json({ winner: false });
    }

    const bids = await bidModel
      .find({ _id: { $in: product.bidId } })
      .populate("userId", { username: 1, image: 1 })
      .sort({ price: -1 });

    if (bids.length === 0) {
      return res.status(404).json({ winner: false });
    }

    const winner = bids[0];

    if (winner.userId._id.toString() === userId) {
      return res.status(200).json({ winner: true, product });
    } else {
      return res.status(404).json({ winner: false });
    }
  } catch (error) {
    console.log(error);
    console.log(error.stack);
    return res.status(500).json({ success: false, error });
  }
});
