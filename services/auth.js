import { User } from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import gravatar from "gravatar";
import { nanoid } from "nanoid";
import handlebars from "handlebars";
import dotenv from "dotenv";
import path, { dirname } from "node:path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import {
  HttpError,
  getFullNameFromGoogleTokenPayload,
} from "../helpers/index.js";
import { sendEmail } from "../utils/index.js";

dotenv.config();
const { SECRET_KEY, BASE_URL } = process.env;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tempatesDir = path.join(__dirname, "../", "templates");

export const registerUser = async (payload) => {
  const { email, password } = payload;
  const user = await User.findOne({ email });

  if (user) {
    throw HttpError(409, "Email is already in use");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const avatarURL = gravatar.url(email);
  const verificationCode = nanoid();

  const newUser = await User.create({
    ...payload,
    password: hashedPassword,
    avatarURL,
    verificationCode,
  });

  const verifyEmailData = {
    to: newUser.email,
    subject: "Please verify your email",
    html: `<a target="_blank" href="${BASE_URL}/api/auth/verify/${newUser.verificationCode}">Click to verify your email</a>`,
  };

  await sendEmail(verifyEmailData);

  return newUser;
};

export const verifyUserEmail = async (verificationCode) => {
  const user = await User.findOne({ verificationCode });

  if (!user) {
    throw HttpError(404, "User not found");
  }

  await User.findByIdAndUpdate(user._id, {
    verified: true,
    verificationCode: "",
  });
};

export const resendVerifyUserEmail = async (email) => {
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
};

export const loginUser = async (payload) => {
  const { email, password } = payload;

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

  const tokenPayload = {
    id: user._id,
  };

  const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: "15h" });

  await User.findByIdAndUpdate(user._id, { token });

  return token;
};

export const requestUserPasswordReset = async (email) => {
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
};

export const resetUserPassword = async (resetToken, newPassword) => {
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

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await User.findByIdAndUpdate(user._id, { password: hashedPassword });
};

export const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { token: "" });
};

export const updateUserAvatar = async (userId, avatarURL) => {
  await User.findByIdAndUpdate(userId, { avatarURL });
};

export const loginUserWithGoogle = async (payload) => {
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
  return token;
};
