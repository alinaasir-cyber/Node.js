import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";
import { updateUserProfilePicture } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "personal-finance/profile-pictures", resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError("Upload an image using the 'image' field", 400);
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new AppError("Profile image upload is not configured on this server", 503);
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET
  });

  const uploaded = await uploadToCloudinary(req.file.buffer);
  const user = await updateUserProfilePicture(req.user.id, uploaded.secure_url);

  res.json({
    success: true,
    data: {
      profilePicture: user.profilePicture,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture
      }
    }
  });
});
