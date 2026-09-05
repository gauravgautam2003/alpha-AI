import path from "path";
import fs from "fs";
import multer from "multer";

const uploadDir = path.resolve("./temp")

if(!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {recursive: true})
}

const storage = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, uploadDir)
    },
    filename(req, file, callback) {
        callback(null, `${Date.now()}-${file.originalname}`)
    }
})

const fileFilter = (req, file, callback) => {
    if(file.mimeType == "application/pdf" || file.mimeType.startsWith("image/")) {
        callback(null, true)
    } else {
        callback(new Error("Only PDF and Images are allowed."))
    }
}

export default multer({
    storage, fileFilter, limits: {
        fileSize: 20 * 1024 * 1024 
    }
})