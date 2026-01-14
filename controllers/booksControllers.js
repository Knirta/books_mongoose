import { Book } from "../models/book.js";
import { getAll } from "../services/books.js";
import {
  HttpError,
  ctrlWrapper,
  parsePaginationParams,
  parseSortParams,
  parseFilterParams,
} from "../helpers/index.js";

const getAllController = async (req, res) => {
  const { _id: owner } = req.user;
  const { page, perPage } = parsePaginationParams(req.query);
  const { sortOrder, sortBy } = parseSortParams(req.query);
  const filter = parseFilterParams(req.query);

  const result = await getAll({
    page,
    perPage,
    sortOrder,
    sortBy,
    filter,
    owner,
  });
  res.json(result);
};

const getById = async (req, res) => {
  const { id } = req.params;
  // const result = await Book.findOne({ _id: id });
  const result = await Book.findById(id);
  if (!result) {
    throw HttpError(404, "Book not found");
  }
  res.json(result);
};

const add = async (req, res) => {
  const { _id: owner } = req.user;
  const result = await Book.create({ ...req.body, owner });
  res.status(201).json(result);
};

const updateById = async (req, res) => {
  const { id } = req.params;
  const result = await Book.findByIdAndUpdate(id, req.body, { new: true });
  if (!result) {
    throw HttpError(404, "Book for updating not found");
  }
  res.json(result);
};

const updateFavorite = async (req, res) => {
  const { id } = req.params;
  const result = await Book.findByIdAndUpdate(id, req.body, { new: true });
  if (!result) {
    throw HttpError(404, "Book for updating favorite field not found");
  }
  res.json(result);
};

const deleteById = async (req, res) => {
  const { id } = req.params;
  const result = await Book.findByIdAndDelete(id);
  if (!result) {
    throw HttpError(404, "Book for deleting not found");
  }
  res.json({ message: "Delete success" });
};

export default {
  getAllBooks: ctrlWrapper(getAllController),
  getOneBook: ctrlWrapper(getById),
  createBook: ctrlWrapper(add),
  updateBook: ctrlWrapper(updateById),
  updateFavorite: ctrlWrapper(updateFavorite),
  deleteBook: ctrlWrapper(deleteById),
};
