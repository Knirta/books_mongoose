import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tempDir = path.join(__dirname, "../", "temp");

const multerConfig = multer.diskStorage({
  destination: tempDir,
  filename: async (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: multerConfig });

export default upload;
