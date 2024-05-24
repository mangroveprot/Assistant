module.exports = {
  config: {
    name: "leave",
    version: "1.0",
    author: "ViLLAVER",
    category: "events"
  },

  onStart: async ({
    event, message, api
  }) => {
    if (event.logMessageType === "log:unsubscribe") {
      const {
        threadID
      } = event;
      const {
        leftParticipantFbId,
        actorFbId
      } = event.logMessageData;

      let userName = leftParticipantFbId === api.getCurrentUserID() ? "You": null;
      let actorName = actorFbId === api.getCurrentUserID() ? "You": null;

      if (!userName && leftParticipantFbId) {
        try {
          const userInfo = await api.getUserInfo(leftParticipantFbId);
          userName = userInfo[leftParticipantFbId]?.name || "Unknown";
        } catch (error) {
          console.error("Error fetching user info:", error);
          userName = "Unknown";
        }
      }

      if (!actorName && actorFbId) {
        try {
          const actorInfo = await api.getUserInfo(actorFbId);
          actorName = actorInfo[actorFbId]?.name || "Unknown";
        } catch (error) {
          console.error("Error fetching actor info:", error);
          actorName = "Unknown";
        }
      }

      if (leftParticipantFbId === api.getCurrentUserID()) {
        return;
      } else if (actorFbId === api.getCurrentUserID()) {
        message.send(`${userName} was kicked from the group.`);
      } else {
        message.send(`${userName} left the group.`);
      }
    }
  }
};