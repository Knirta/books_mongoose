import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { HttpError } from "../helpers/index.js";
import { User } from "../models/user.js";

dotenv.config();
const { SECRET_KEY } = process.env;

const authenticate = async (req, res, next) => {
  const { authorization = "" } = req.headers;
  const [bearer, token] = authorization.split(" ");

  if (bearer !== "Bearer") {
    next(HttpError(401));
  }

  //якщо токен шифрувався не тим ключем або якщо токен протух, jwt.verify викине помилку
  try {
    const { id } = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(id);
    if (!user || !user.token || user.token !== token) {
      next(HttpError(401));
    }
    req.user = user;
    next();
  } catch {
    next(HttpError(401));
  }
};

export default authenticate;
