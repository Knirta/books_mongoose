import express from "express";

import { validateBody, authenticate, upload } from "../../middlewares/index.js";
import { schemas } from "../../models/user.js";
import ctrl from "../../controllers/authController.js";

const authRouter = express.Router();

//sign up
authRouter.post(
  "/register",
  validateBody(schemas.registerSchema),
  ctrl.register
);

authRouter.get("/verify/:verificationCode", ctrl.verifyEmail);

authRouter.post(
  "/verify",
  validateBody(schemas.verifyEmailSchema),
  ctrl.resendVerifyEmail
);

//sign in
authRouter.post("/login", validateBody(schemas.loginSchema), ctrl.login);

authRouter.post(
  "/request-password-reset",
  validateBody(schemas.verifyEmailSchema),
  ctrl.requestPasswordReset
);

authRouter.post(
  "/reset-password/:resetToken",
  validateBody(schemas.resetPasswordSchema),
  ctrl.resetPassword
);

authRouter.get("/current", authenticate, ctrl.getCurrent);

authRouter.post("/logout", authenticate, ctrl.logout);

authRouter.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  ctrl.updateAvatar
);

export default authRouter;
