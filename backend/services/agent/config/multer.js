import multer from "multer";

const fileFilter = (req, file, callback) => {
    if (file.mimetype == "application/pdf" || file.mimetype.startsWith("image/")) {
        callback(null, true)
    } else {
        callback(new Error("Only PDF and Images are allowed."))
    }
}

export default multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024
    }
})