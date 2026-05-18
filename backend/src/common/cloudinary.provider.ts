import { v2 as cloudinary } from 'cloudinary';

let configured = false;

function ensureConfigured() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  configured = true;
}

/**
 * Upload a buffer (from multer file) to Cloudinary
 */
export async function uploadToCloudinary(
  file: Express.Multer.File,
  folder = 'prodigy-kyc',
): Promise<{ url: string; publicId: string }> {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: 'auto',
          public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({ url: result!.secure_url, publicId: result!.public_id });
        },
      )
      .end(file.buffer);
  });
}

export { cloudinary };
