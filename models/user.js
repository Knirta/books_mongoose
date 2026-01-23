import { Schema, model } from "mongoose";
import Joi from "joi";

import { handleMongooseError } from "../helpers/index.js";

const emailRegexp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, match: emailRegexp, required: true },
    password: { type: String, minlength: 6, required: true },
    token: { type: String, default: "" },
    avatarURL: { type: String, required: true },
    verified: { type: Boolean, default: false },
    verificationCode: { type: String, default: "" },
  },
  { versionKey: false, timestamps: true }
);

userSchema.post("save", handleMongooseError);

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().pattern(emailRegexp).required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required(),
  password: Joi.string().min(6).required(),
});

const verifyEmailSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required(),
});

const resetPasswordSchema = Joi.object({
  password: Joi.string().min(6).required(),
  // resetToken: Joi.string().required(),
});

const loginWithGoogleAuthSchema = Joi.object({
  code: Joi.string().required(),
});

const schemas = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resetPasswordSchema,
  loginWithGoogleAuthSchema,
};

const User = model("user", userSchema);

export { User, schemas };
