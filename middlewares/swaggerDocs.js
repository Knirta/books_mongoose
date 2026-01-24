import { HttpError } from "../helpers/index.js";
import swaggerUI from "swagger-ui-express";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const swaggerPath = path.join(__dirname, "../", "docs", "swagger.json");

const swaggerDocs = () => {
  try {
    const swaggerDocs = JSON.parse(fs.readFileSync(swaggerPath).toString());
    return [...swaggerUI.serve, swaggerUI.setup(swaggerDocs)];
  } catch (error) {
    return (req, res, next) => {
      next(HttpError(500, "Can't load swagger docs"));
    };
  }
};

export default swaggerDocs;
