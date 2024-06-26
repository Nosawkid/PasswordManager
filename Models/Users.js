const mongoose = require("mongoose");
const { Schema } = mongoose;

const passwordSchema = new Schema(
  {
    socialName: {
      type: String,
      required: true,
    },
    socialPassword: {
      type: String,
      required: true,
    },
    passTag: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  passwords: [passwordSchema],
});

module.exports = mongoose.model("User", userSchema);
