import dotenv from "dotenv";
import { Jimp } from "jimp";
import path, { dirname } from "node:path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

import {
  registerUser,
  loginUser,
  logoutUser,
  verifyUserEmail,
  resendVerifyUserEmail,
  requestUserPasswordReset,
  resetUserPassword,
  updateUserAvatar,
  loginUserWithGoogle,
} from "../services/auth.js";

import {
  ctrlWrapper,
  HttpError,
  validateCode,
  generateAuthUrl,
} from "../helpers/index.js";

import { saveFileToCloudinary } from "../utils/index.js";

dotenv.config();
const { ENABLE_CLOUDINARY } = process.env;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const avatarsDir = path.join(__dirname, "../", "public", "avatars");

const register = async (req, res) => {
  const newUser = await registerUser(req.body);

  res.status(201).json({
    name: newUser.name,
    email: newUser.email,
  });
};

const verifyEmail = async (req, res) => {
  const { verificationCode } = req.params;

  await verifyUserEmail(verificationCode);

  res.json({
    message: "Email successfully verified",
  });
};

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;

  await resendVerifyUserEmail(email);

  res.json({
    message: "Verification email sent",
  });
};

const login = async (req, res) => {
  const token = await loginUser(req.body);

  res.json({
    token,
  });
};

const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  await requestUserPasswordReset(email);

  res.json({
    message: "Password reset link has been sent to your email",
  });
};

const resetPassword = async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  await resetUserPassword(resetToken, password);

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
  await logoutUser(_id);

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

  await updateUserAvatar(_id, avatarURL);

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

  const token = await loginUserWithGoogle(payload);

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
