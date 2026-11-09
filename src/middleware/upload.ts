import path from "path";
import multer from "multer";

export const upload = multer({
  dest: path.resolve("uploads"),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
