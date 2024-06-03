const { selectDatabase, mongoose } = require("../database/mongoDB");
const log = require("../logger/log");

// Db name
const dbName = "threadsDataModel";

// Function to define or get the existing schema
const defineSchema = async () => {
  try {
    const connect = await selectDatabase(dbName);

    // Check if the model already exists
    if (mongoose.models.threadsData) {
      return mongoose.models.threadsData;
    }

    // Define the schema
    const threadsSchema = new mongoose.Schema(
      {
        threadName: {
          type: String,
          default: null,
        },
        threadID: {
          type: String,
          required: [true, "Please add a thread ID it can't be empty!"],
          default: "0",
        },
      },
      {
        timestamps: true,
      }
    );

    // Create the model
    const threadsData = mongoose.model("threadsData", threadsSchema);
    return threadsData;
  } catch (error) {
    return error.message;
  }
};

const findThread = async (threadID) => {
  try {
    const threadsDataModel = await defineSchema();
    // Check if the threadsDataModel is a string
    if (typeof threadsDataModel === "string") {
      throw new Error(threadsDataModel);
    }

    // Find the thread by ID
    const thread = await threadsDataModel.findOne({ threadID });

    if (!thread) {
      return null;
    }

    return thread;
  } catch (error) {
    log.err(error);
    return null;
  }
};

const init = async (threadID) => {
  threadID = threadID || "1";
  try {
    if (!threadID) {
      log.err("Please add a thread ID it can't be empty!");
      return;
    }
    const threadsDataModel = await defineSchema();
    // Check if the threadsDataModel is a string
    if (typeof threadsDataModel === "string") {
      throw new Error(threadsDataModel);
    }
    // Check if the thread already exists
    const existingThread = await findThread(threadID);
    if (existingThread) {
      log.err("Thread already exists", existingThread);
      return;
    }

    // Create an new thread
    const threadDatas = new threadsDataModel({
      threadName: "Example Thread",
      threadID: threadID,
    });

    // Save the example document to the database
    await threadDatas.save();
    log.success("Thread save successfully", threadDatas);
  } catch (error) {
    log.error("Initialization error:", error.message);
  }
};

const test = async () => {
  const threadID = "12345";
  const existingThread = await findThread(threadID);
  console.log(existingThread);
};
init();
test();
