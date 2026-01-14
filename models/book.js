import { Schema, model } from "mongoose";
import Joi from "joi";

import { handleMongooseError } from "../helpers/index.js";

const genreList = ["fantastic", "love", "detective", "history"];
const dateRegexp = /^\d{2}-\d{2}-\d{4}$/;

const bookSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    genre: {
      type: String,
      enum: genreList,
      required: true,
    },
    date: {
      type: String,
      match: dateRegexp,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { versionKey: false, timestamps: true }
);

//bookSchema - схема для внутрішньої перевірки; після того як дані з запиту (з фронтенду) пройшли перевірку Joi,
//  яка є мідлварою перед винонанням контролера у своєму роуті, далі відбувається збереження даних у базі даних:
// тут mongoose застосовує свою перевірку перед збереженням  bookSchema.post("save", handleMongooseError);
bookSchema.post("save", handleMongooseError);

const addSchema = Joi.object({
  title: Joi.string().min(3).max(21).required(),
  author: Joi.string().min(3).max(21).required(),
  favorite: Joi.boolean(),
  genre: Joi.string()
    .valid(...genreList)
    .required(),
  date: Joi.string().pattern(dateRegexp).required(),
});

const updateFavoriteSchema = Joi.object({
  favorite: Joi.boolean().required(),
});

const schemas = {
  addSchema,
  updateFavoriteSchema,
};

const Book = model("book", bookSchema);

export { Book, schemas };
