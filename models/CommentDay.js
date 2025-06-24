const mongoose = require("mongoose");

const ReplySchema = new mongoose.Schema({
  user: {
    _id: String,
    name: String,
    avatar: String,
  },
  text: String,
  likes: [String], // userId list
  createdAt: { type: Date, default: Date.now }
});

const CommentSchema = new mongoose.Schema({
  user: {
    _id: String,
    name: String,
    avatar: String,
  },
  text: String,
  likes: [
    {
      userId: String,
      name: String,
      avatar: String
    }
  ],
  replies: [ReplySchema],
  createdAt: { type: Date, default: Date.now }
});

const CommentDaySchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // format: YYYY-MM-DD
  comments: [CommentSchema]
});

module.exports = mongoose.model("CommentDay", CommentDaySchema);
