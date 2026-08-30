import multer from "multer";

const allowedMimeTypes = new Set([
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/jpeg",
    "image/png",
    "image/webp",
]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
        }

        callback(null, true);
    },
});

export default upload;
