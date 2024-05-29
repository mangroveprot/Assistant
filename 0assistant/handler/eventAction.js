//
const chalk = require("chalk");
function handleEvent(admin, api, event) {
  try {
    switch (event.type) {
      case "message":
        console.log(chalk.green("MESSAGE:"), formatMessage(event));
        handleIncomingMessage(api, event);
        break;
      case "message_unsend":
        console.log(chalk.green("MESSAGE_UNSEND:"), formatUnsendMessage(event));
        handleUnsendMessage(api, event);
        break;
      case "message_reaction":
        console.log(
          chalk.green("MESSAGE_REACTION:"),
          formatMessageReaction(event)
        );
        handleMessageReaction(admin, api, event);
        break;
      case "typ":
        //console.log(chalk.green("TYP:"), formatTyp(event));
        handleTyp(api, event);
        break;
      case "presence":
        handlePresence(api, event);
        break;
      case "read_receipt":
        formatReadReceipt(event);
        handleReadReceipt(api, event);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(chalk.red("Error in handleEvent:"), error);
  }
}

function formatMessage(event) {
  return {
    type: "message",
    senderID: event.senderID,
    body: event.body,
    threadID: event.threadID,
    messageID: event.messageID,
    attachments: event.attachments,
    mentions: event.mentions,
    timestamp: event.timestamp,
    isGroup: event.isGroup,
    participantIDs: event.participantIDs,
  };
}

function formatUnsendMessage(event) {
  return {
    type: "message_unsend",
    threadID: event.threadID,
    messageID: event.messageID,
    senderID: event.senderID,
    deletionTimestamp: event.deletionTimestamp,
    timestamp: event.timestamp,
  };
}

function formatMessageReaction(event) {
  return {
    type: "message_reaction",
    threadID: event.threadID,
    messageID: event.messageID,
    senderID: event.senderID,
    reaction: event.reaction,
    timestamp: event.timestamp,
  };
}

function formatTyp(event) {
  return {
    type: "typ",
    threadID: event.threadID,
    senderID: event.senderID,
    isTyping: event.isTyping,
    timestamp: event.timestamp,
  };
}

//━━━━━━━━━━━━━━━━━━━//

function handleMessageReaction(admin, api, event) {
  const formattedEvent = formatMessageReaction(event);
  if (event.reaction == "😠" && [""].includes(event.userID)) {
    api.removeUserFromGroup(event.senderID, event.threadID, (err) => {
      if (err) return console.log(err);
    });
  } else if (
    event.reaction == "❌" &&
    event.senderID == api.getCurrentUserID() &&
    admin.includes(event.userID)
  ) {
    api.unsendMessage(event.messageID);
  }
}

function handleTyp(api, event) {
  // add your event
}

function formatPresence(event) {
  return {
    // add your event
  };
}

function handlePresence(api, event) {
  // add your event
}

function formatReadReceipt(event) {
  return {
    // add your event
  };
}

function handleReadReceipt(api, event) {
  // // add your event
}

function handleIncomingMessage(api, event) {
  // Handle the incoming message data (e.g., store in a JSON file, process, etc.)
}

function handleUnsendMessage(api, event) {
  // Handle the message unsend event (e.g., update your data, log, etc.) or resend the message that unsend
}

module.exports = {
  handleEvent,
};
