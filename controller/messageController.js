import messageModal from "../model/messageModal.js";

export const getrecentChat = async (req, res) => {
  try {
    const { userId } = req.body;

    const conversations = await messageModal
      .find({ users: userId })
      .sort({ timestamp: -1 })
      // .limit(10) // limit to the 10 most recent conversations
      .populate({
        path: "users",
        select: "_id email username phoneNo fullname image role status about",
        match: { _id: { $ne: userId } }, // exclude the current user from the result
      });
    if (conversations) {
      const recentConversations = conversations.map((conversation, index) => {
        const otherUser = conversation.users[0]; // assuming there are only 2 users in a conversation
        const lastMessage = conversation.messages?.slice(-1)[0]; // get the last message of the conversation
        const unseen = conversation.unseenMsgs.filter((item) => {
          return item.user == userId;
        });

        return {
          id: conversation._id,
          username: otherUser.username,
          image: otherUser.image,
          otherUserId: otherUser._id,
          lastMessage: lastMessage
            ? {
                message: lastMessage.text,
                time: lastMessage.timestamp,
                sender: lastMessage.sender,
              }
            : null,
          unseenMsgs: unseen[0].noMsg,
          timestamp: conversation.timestamp,
        };
      });
      res.status(200).json({ recentConversations });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ err: error.stack });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { userId, recieverId } = req.body;

    const conversation = await messageModal
      .findOne({
        users: { $all: [userId, recieverId] },
      })
      .populate("messages.sender", { username: 1, image: 1 });
    return res.status(200).json({ messages: conversation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ err: error.stack });
  }
};

export const seenMessages = async (req, res) => {
  try {
    const conversation = await messageModal.findOneAndUpdate(
      { _id: req.body.conversationId, "unseenMsgs.user": req.body.userId },
      { $set: { "unseenMsgs.$.noMsg": 0 } },
      { new: true }
    );
    if (conversation) {
      res.status(200).json({ recentConversations: conversation });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ err: error.stack });
  }
};
