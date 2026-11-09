import fs from "fs/promises";
import { v2 as cloudinary } from "cloudinary";
import { logger } from "../logger.ts";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (filePath: string) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "announcements",
  });
  await fs.unlink(filePath);
  logger.info("Announcement photo uploaded");
  return result.secure_url;
};
