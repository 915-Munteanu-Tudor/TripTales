const mongoose = require("mongoose");

class DatabaseConnection {
  init(app) {
    this.databaseConnectionUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.lycgfjj.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
    this.app = app;
  }

  getNewDbConnection() {
    mongoose
      .connect(
        this.databaseConnectionUri
      ) // mern = db name
      .then(() => {
        this.app.listen(process.env.PORT || 5000);
      })
      .catch((err) => {
        console.log(err);
      });
  }
}

module.exports = new DatabaseConnection();
