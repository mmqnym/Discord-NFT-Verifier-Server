import mongoose from "mongoose";

/**
 * @property discordId: Discord user id.
 * @property walletAddress: the user's wallet address(account).
 * @property roleIds: Save the role ids user obtained.
 */
const userSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
  },
  walletAddress: {
    type: String,
    required: true,
  },
  roleIds: {
    type: [String],
    required: true,
  },
});

export const userModel = mongoose.model("user", userSchema, "user");
