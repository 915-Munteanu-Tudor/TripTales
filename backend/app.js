const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const postsRoutes = require("./routes/posts-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");
const databaseConnection = require("./util/database-connection");

const app = express();

//extracts json from body, to any request incoming, calls next
app.use(bodyParser.json());

app.use("/uploads/images", express.static(path.join("uploads", "images"))); //just return statically the file from the path

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); //cors, allows certain domains to have access
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  ); //specify the headers the requests sent by the browser may have
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

app.use("/api/posts", postsRoutes);
app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

//error handling middleware function
app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }

  if (error instanceof multer.MulterError) {
    // Handle multer error
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File size must not exceed 5 MB!",
      });
    }
  }

  //if resp has already been sent
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

databaseConnection.init(app);
databaseConnection.getNewDbConnection();
