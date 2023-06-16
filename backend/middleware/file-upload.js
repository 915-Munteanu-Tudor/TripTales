const multer = require("multer");
const uuid = require("uuid");
const HttpError = require("../models/http-error");

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpg": "jpg",
  "image/jpeg": "jpeg",
};

const fileUpload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/images");
    },
    filename: (req, file, cb) => {
      const ext = MIME_TYPE_MAP[file.mimetype];
      cb(null, uuid.v1() + "." + ext); //in both cbs null is for error
    },
  }),
});

const isValidMimeType = (req, res, next) => {
  const isValid = !!MIME_TYPE_MAP[req.file.mimetype];
  if (!isValid) {
    return next(
      new HttpError("File extension must be jpg, jpeg, or png!", 400)
    );
  } else {
    next();
  }
};

exports.fileUpload = fileUpload;
exports.isValidMimeType = isValidMimeType;
