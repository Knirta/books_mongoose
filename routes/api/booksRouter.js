import express from "express";

import ctrl from "../../controllers/booksControllers.js";
import { validateBody, isValidId } from "../../middlewares/index.js";
import { schemas } from "../../models/book.js";
import { authenticate } from "../../middlewares/index.js";

const booksRouter = express.Router();

booksRouter.get("/", authenticate, ctrl.getAllBooks);

booksRouter.get("/:id", authenticate, isValidId, ctrl.getOneBook);

booksRouter.post(
  "/",
  authenticate,
  validateBody(schemas.addSchema),
  ctrl.createBook
);

booksRouter.put(
  "/:id",
  authenticate,
  isValidId,
  validateBody(schemas.addSchema),
  ctrl.updateBook
);

booksRouter.patch(
  "/:id/favorite",
  authenticate,
  isValidId,
  validateBody(schemas.updateFavoriteSchema),
  ctrl.updateFavorite
);

booksRouter.delete("/:id", authenticate, isValidId, ctrl.deleteBook);

export default booksRouter;
