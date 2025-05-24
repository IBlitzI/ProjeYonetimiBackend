const mongoose = require("mongoose");
exports.connectToMongoDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_CONNECTION, {
      compressors: "zlib",
      autoIndex: true,
      connectTimeoutMS: 5000,
    });
    console.log("Database connected successfully");
  } catch (error) {
    console.log("error", error);
    throw new Error(error);
  }
};
