import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'du1txbjcq',
  api_key: process.env.CLOUDINARY_API_KEY || '394573846495273',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'waste' // Fallback to 'waste' in case it's the secret
});

export const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    // If we have an actual secret configured (or if 'waste' happens to be the secret), try regular upload
    // If not, we will attempt an unsigned upload with 'waste' as the preset.
    // Railway env should provide CLOUDINARY_API_SECRET if regular upload is preferred.
    
    let stream;
    // We will attempt unsigned upload by default if we suspect 'waste' is an upload preset
    if (!process.env.CLOUDINARY_API_SECRET) {
      stream = cloudinary.uploader.unsigned_upload_stream('waste', (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      });
    } else {
      stream = cloudinary.uploader.upload_stream({ folder: 'waste' }, (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      });
    }

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

export default cloudinary;
