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
config();

const emailSent = (code, email, username) => {
  return new Promise((resolve, reject) => {
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
        user: "hn380322@gmail.com",
        pass: "mfolajhvwknqvabt",
      },
    });

    const mailOptions = {
      from: "hn380322@gmail.com",
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
  });
};
const contactEmail = (name, email, message) => {
  return new Promise((resolve, reject) => {
    const output = `
    <div style="background-color: #f5f5f5; padding: 50px;">
    <div style="background-color: #fff; padding: 50px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,.1);">
      <h1 style="font-size: 28px; margin-bottom: 30px;">New Contact Email</h1>
      <p style="font-size: 16px;"><strong>Name:</strong> ${name}</p>
      <p style="font-size: 16px;"><strong>Email:</strong> ${email}</p>
      <p style="font-size: 16px;"><strong>Message:</strong></p>
      <div style="background-color: #f7f7f7; border-radius: 10px; padding: 20px; margin-bottom: 30px; font-size: 16px;">
        ${message}
      </div>
      <p style="font-size: 16px;">Please respond to this email to address the inquiry.</p>
    </div>
  </div>
    `;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      service: "gmail",
      auth: {
        user: "hn380322@gmail.com",
        pass: "mfolajhvwknqvabt",
      },
    });

    const mailOptions = {
      from: email,
      to: "hn380322@gmail.com",
      subject: "New Contact Inquiry",
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
  });
};

const client = twilio(process.env.ACCOUNTSID, process.env.AUTHTOKEN);
export const SignUpEmail = catchAsync(async (req, res, next) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(401).json({
        success: false,
        message: "Already have an account",
      });
    }

    const hashedPassword = hashSync(password, 10);

    const newUser = await userModel.create({
      email,
      password: hashedPassword,
      username,
    });
    if (newUser) {
      const code = crypto.randomBytes(3).toString("hex").toUpperCase();
      const result = await emailSent(code, email, username);
      console.log(result);

      return res.status(200).json({
        success: true,
        userId: newUser._id,
        email,
        code,
      });
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
export const SignUpPhone = catchAsync(async (req, res, next) => {
  const { username, phone, password } = req.body;
  console.log(phone);
  try {
    const existingUser = await userModel.findOne({ phone });
    if (existingUser) {
      return res.status(401).json({
        success: false,
        message: "Already have an account",
      });
    }

    const hashedPassword = hashSync(password, 10);

    const newUser = await userModel.create({
      phone,
      password: hashedPassword,
      username,
    });
    if (newUser) {
      const code = crypto.randomBytes(3).toString("hex").toUpperCase();
      console.log(phone);
      client.messages
        .create({
          body: `Your OTP code is ${code}`,
          // from: "+12543182690", // Twilio phone number
          from: "+13152825704",
          to: phone, // User's phone number
        })
        .then((message) => {
          console.log(message.sid);
          return res.status(200).json({
            success: true,
            userId: newUser._id,
            phone,
            code,
          });
        })
        .catch((err) => {
          console.error(err);
          res.status(500).json({ err: err });
        });

      // return res.status(200).json({
      //   success: true,
      //   userId: newUser._id,
      //   phone,
      //   code,
      // });
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
export const verifyAccount = catchAsync(async (req, res, next) => {
  try {
    const { userId } = req.body;
    const result = await userModel.findOneAndUpdate(
      { _id: userId },
      { $set: { verify: true } },
      { new: true }
    );
    if (result) {
      const token = jwt.sign(
        { id: result._id, email: result.email },
        process.env.JWT_SECRET,
        { expiresIn: "700h" }
      );
      return res.status(200).json({
        user: {
          _id: result._id,
          username: result.username,
          email: result.email,
          image: result.image,
          token,
        },
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.stack });
  }
});

export const loginUser = catchAsync(async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;
    console.log(req.body);

    let user;
    let userField;

    if (email) {
      user = await userModel.findOne({ email: email });
      userField = "email";
    } else if (phone) {
      user = await userModel.findOne({ phone: "+" + phone });
      userField = "phone";
    } else {
      return res.status(400).json({
        success: false,
        message: "Please provide an email or phone",
      });
    }

    if (!user)
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });

    if (!check(password, user.password))
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });

    if (user.verify !== true) {
      if (user.phone) {
        const code = crypto.randomInt(100000, 1000000);
        const validPhone = "+" + user.phone;
        client.messages
          .create({
            body: `Your OTP code is ${code}`,
            from: "+13152825704",
            to: validPhone, // User's phone number
          })
          .then((message) => {
            console.log(message.sid);
            return res.status(400).json({ userId: user._id, code });
          })
          .catch((err) => {
            console.error(err);
            res.status(500).json({ err: err });
          });
        return;
      } else if (user.email) {
        const code = crypto.randomInt(100000, 1000000);
        const result = await emailSent(code, user.email, user.username);
        if (result) {
          return res.status(400).json({
            userId: user._id,
            code,
          });
        } else {
          return res.status(500).json({
            success: false,
            message: "Error sending email verification",
          });
        }
      }
    }

    const token = jwt.sign(
      { id: user._id, [userField]: user[userField] },
      process.env.JWT_SECRET,
      { expiresIn: "700h" }
    );

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: {
        _id: user._id,
        [userField]: user[userField],
        username: user.username,
        image: user.image,
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error,
    });
  }
});

export const getProfile = catchAsync(async (req, res, next) => {
  try {
    const { userId } = req.body;
    const result = await userModel.findOne({ _id: userId });
    if (result) {
      res.status(200).json({ Profile: result });
    }
  } catch (err) {
    return res.status(500).json({ err });
  }
});
export const userProfile = catchAsync(async (req, res, next) => {
  try {
    const { userId } = req.body;
    console.log(req.body);
    console.log(req.file);
    if (req.file) {
      const result = await userModel.findOneAndUpdate(
        { _id: userId },
        { $set: { coverPhoto: req.file.filename } },
        { new: true }
      );
      if (result) {
        res.status(200).json({ updatedProfile: result });
      }
    }
  } catch (err) {
    return res.status(500).json({ err });
  }
});
export const updateProfileImage = catchAsync(async (req, res, next) => {
  try {
    const { userId } = req.body;
    console.log(req.body);
    console.log(req.file);
    if (req.file) {
      const result = await userModel.findOneAndUpdate(
        { _id: userId },
        { $set: { image: req.file.filename } },
        { new: true }
      );
      if (result) {
        res.status(200).json({ updatedProfile: result });
      }
    }
  } catch (err) {
    return res.status(500).json({ err });
  }
});
export const getUserProduct = catchAsync(async (req, res, next) => {
  try {
    const { userId } = req.body;
    const result = await productModel.find({ userId }).populate("userId", "");
    if (result) {
      res.status(200).json({ userProduct: result });
    }
  } catch (err) {
    return res.status(500).json({ err });
  }
});
export const setting = catchAsync(async (req, res, next) => {
  try {
    const { userId, username, facebook, twitter, discord, bioDetail } =
      req.body;
    console.log(req.body);
    const result = await userModel.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          username: username,
          facebook: facebook,
          twitter: twitter,
          discord: discord,
          bioDetail: bioDetail,
        },
      },
      { new: true }
    );
    console.log(result);
    if (result) {
      res.status(200).json({ updated: result });
    }
  } catch (err) {
    console.log(err.stack);
    return res.status(500).json({ err });
  }
});
export const sendCodePhone = catchAsync(async (req, res, next) => {
  const { code, phoneNo } = req.body;
  const validPhone = "+" + phoneNo;
  client.messages
    .create({
      body: `Your OTP code is ${code}`,
      // from: "+12543182690", // Twilio phone number
      from: "+13152825704",
      to: validPhone, // User's phone number
    })
    .then((message) => {
      console.log(message.sid);
      res.status(200).json({ message: message.sid });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ err: err });
    });
});
export const sendEmail = catchAsync(async (req, res, next) => {
  const { username, code, email } = req.body;
  console.log(req.body);
  try {
    const result = await emailSent(code, email, username);

    if (result) {
      console.log(result);
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    return res.status(500).json({ error: error });
  }
});
export const updatePhoneNumber = catchAsync(async (req, res, next) => {
  console.log(req.body);
  const { userId, phoneNo } = req.body;
  console.log(phoneNo);
  try {
    const result = await userModel.findOneAndUpdate(
      { _id: userId },
      { $set: { phone: phoneNo } },
      { new: true }
    );
    console.log(result);
    if (result) {
      res.status(200).json({ updated: result });
    }
  } catch (error) {
    res.status(500).json({ err: error.stack });
  }
});
export const updateEmail = catchAsync(async (req, res, next) => {
  const { userId, email } = req.body;

  try {
    const result = await userModel.findOneAndUpdate(
      { _id: userId },
      { $set: { email: email } },
      { new: true }
    );
    if (result) {
      res.status(200).json({ updated: result });
    }
  } catch (error) {
    res.status(500).json({ err: error.stack });
  }
});
export const ContactUs = catchAsync(async (req, res, next) => {
  const { name, message, email } = req.body;
  console.log(req.body);
  try {
    const result = await contactEmail(name, email, message);
    if (result) {
      res.status(200).json({ success: true });
    }
  } catch (error) {
    return res.status(500).json({ error: error });
  }
});
