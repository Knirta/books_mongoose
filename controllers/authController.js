import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import gravatar from "gravatar";
import { Jimp } from "jimp";
import path from "node:path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs/promises";
import { nanoid } from "nanoid";
import handlebars from "handlebars";
import { generateAuthUrl } from "../helpers/googleOAuth2.js";

import { User } from "../models/user.js";
import {
  ctrlWrapper,
  HttpError,
  sendEmail,
  saveFileToCloudinary,
  getFullNameFromGoogleTokenPayload,
  validateCode,
} from "../helpers/index.js";

dotenv.config();
const { SECRET_KEY, BASE_URL, ENABLE_CLOUDINARY } = process.env;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const avatarsDir = path.join(__dirname, "../", "public", "avatars");
const tempatesDir = path.join(__dirname, "../", "templates");

const register = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    throw HttpError(409, "Email is already in use");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const avatarURL = gravatar.url(email);
  const verificationCode = nanoid();

  const newUser = await User.create({
    ...req.body,
    password: hashedPassword,
    avatarURL,
    verificationCode,
  });

  const verifyEmailData = {
    to: email,
    subject: "Please verify your email",
    html: `<a target="_blank" href="${BASE_URL}/api/auth/verify/${verificationCode}">Click to verify your email</a>`,
  };

  await sendEmail(verifyEmailData);

  res.status(201).json({
    name: newUser.name,
    email: newUser.email,
  });
};

const verifyEmail = async (req, res) => {
  const { verificationCode } = req.params;
  const user = await User.findOne({ verificationCode });

  if (!user) {
    throw HttpError(404, "User not found");
  }
  await User.findByIdAndUpdate(user._id, {
    verified: true,
    verificationCode: "",
  });

  res.json({
    message: "Email successfully verified",
  });
};

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(404, "User not found");
  }
  if (user.verified) {
    throw HttpError(400, "Email is already verified");
  }

  const verifyEmailData = {
    to: email,
    subject: "Please verify your email",
    html: `<a target="_blank" href="${BASE_URL}/api/auth/verify/${user.verificationCode}">Click to verify your email</a>`,
  };

  await sendEmail(verifyEmailData);

  res.json({
    message: "Verification email sent",
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(401, "Email or password is invalid");
  }

  if (!user.verified) {
    throw HttpError(401, "Email is not verified");
  }

  const passwordCompare = await bcrypt.compare(password, user.password);

  if (!passwordCompare) {
    throw HttpError(401, "Email or password is invalid");
  }

  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "15h" });
  await User.findByIdAndUpdate(user._id, { token });

  res.json({
    token,
  });
};

const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(404, "User not found");
  }

  const resetToken = jwt.sign({ sub: user._id, email }, SECRET_KEY, {
    expiresIn: "15m",
  });

  const resetPasswordTempatePath = path.join(
    tempatesDir,
    "resetPasswordEmail.html"
  );

  const templateSource = (
    await fs.readFile(resetPasswordTempatePath)
  ).toString();

  const template = handlebars.compile(templateSource);

  const html = template({
    name: user.name,
    link: `${BASE_URL}/api/auth/reset-password/${resetToken}`,
  });

  const resetEmailData = {
    to: email,
    subject: "Password Reset Request",
    html,
  };

  await sendEmail(resetEmailData);

  res.json({
    message: "Password reset link has been sent to your email",
  });
};

const resetPassword = async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  let payload;
  try {
    payload = jwt.verify(resetToken, SECRET_KEY);
  } catch (error) {
    throw HttpError(400, "Invalid or expired reset token");
  }

  const user = await User.findById(payload.sub);

  if (!user) {
    throw HttpError(404, "User not found");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.findByIdAndUpdate(user._id, { password: hashedPassword });

  res.json({
    message: "Password has been reset successfully",
  });
};

const getCurrent = async (req, res) => {
  const { name, email } = req.user;

  res.json({ name, email });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });

  res.json({
    message: "Logout is successful",
  });
};

const updateAvatar = async (req, res) => {
  const { _id } = req.user;
  const { path: tempUpload, originalname } = req.file;

  const filename = `${_id}_${originalname}`;
  const resultUpload = path.join(avatarsDir, filename);

  const image = await Jimp.read(tempUpload);
  image.resize({ w: 250 });
  await image.write(tempUpload);

  let avatarURL;

  if (ENABLE_CLOUDINARY === "true") {
    avatarURL = await saveFileToCloudinary(req.file);
  } else {
    await fs.rename(tempUpload, resultUpload);
    avatarURL = path.join("avatars", filename);
  }

  await User.findByIdAndUpdate(_id, { avatarURL });

  res.json({ avatarURL });
};

const getGoogleOAuthUrl = async (req, res) => {
  const url = generateAuthUrl();
  res.json({
    status: 200,
    message: "Successfully generated Google OAuth URL",
    data: { url },
  });
};

const loginWithGoogle = async (req, res) => {
  const { code } = req.body;
  const loginTicket = await validateCode(code);
  const payload = loginTicket.getPayload();
  if (!payload) {
    throw HttpError(401, "Unauthorized");
  }

  let user = await User.findOne({ email: payload.email });

  if (!user) {
    const password = await bcrypt.hash(nanoid(), 10);
    const avatarURL = gravatar.url(payload.email);
    user = await User.create({
      email: payload.email,
      name: getFullNameFromGoogleTokenPayload(payload),
      password,
      avatarURL,
      verified: true,
    });
  }

  const payloadForToken = {
    id: user._id,
  };

  const token = jwt.sign(payloadForToken, SECRET_KEY, { expiresIn: "15h" });
  await User.findByIdAndUpdate(user._id, { token });

  res.json({
    token,
  });
};

export default {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  updateAvatar: ctrlWrapper(updateAvatar),
  verifyEmail: ctrlWrapper(verifyEmail),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
  requestPasswordReset: ctrlWrapper(requestPasswordReset),
  resetPassword: ctrlWrapper(resetPassword),
  getGoogleOAuthUrl: ctrlWrapper(getGoogleOAuthUrl),
  loginWithGoogle: ctrlWrapper(loginWithGoogle),
};
