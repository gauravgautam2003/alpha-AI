import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({
    quiet: true,
    path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env")
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadBuffer = (buffer, options = {}) => new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
        {
            folder: "alpha-ai",
            resource_type: "auto",
            type: "upload",
            access_mode: "public",
            overwrite: true,
            ...options,
        },
        (error, result) => error ? reject(error) : resolve(result)
    );

    stream.end(buffer);
});

export default cloudinary;