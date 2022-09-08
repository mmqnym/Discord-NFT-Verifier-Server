"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * @property discordId: Discord user id.
 * @property walletAddress: The user's wallet address(account).
 * @property roleIds: Save the discord role ids user obtained.
 */
const userSchema = new mongoose_1.default.Schema({
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
exports.userModel = mongoose_1.default.model("user", userSchema, "user");
