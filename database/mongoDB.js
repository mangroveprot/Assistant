const mongoose = require("mongoose");
const log = require("../logger/log");
const { config } = require("../utils");
const { mongodbURI } = config.assistant;

async function connectToDb(dbName) {
  if (!dbName) {
    throw new Error("Database name must be provided");
  }

  mongoose.set("strictQuery", false);
  try {
    await mongoose.connect(mongodbURI, {
      dbName: dbName,
    });
    return true;
  } catch (error) {
    log.error("Error connecting to MongoDB:", error);
    return false;
  }
}

// Test MongoDB connection
async function initializeMongoDB() {
  try {
    await mongoose.connect(mongodbURI);
    return true;
  } catch (error) {
    throw new Error("Failed to connect to MongoDB: " + error.message);
  }
}

module.exports = { connectToDb, initializeMongoDB, mongoose };
