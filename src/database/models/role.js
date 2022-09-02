"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * @property tokenAddress: A token contract address.
 * @property roles: Roles attributes
 * @property roles.roleName: It's only used to display to the user, so it does not have to be correct.
 * If you want to set the discord role by name, you must set its value to the latest
 * @property roles.roleId: It's used to set discord role, must be correct.
 * @property roles.requiredAmount: The minimum amount of NFT holding required to get this role
 */
const roleSchema = new mongoose_1.default.Schema({
    tokenAddress: {
        type: String,
        required: true,
    },
    roles: {
        type: [
            {
                roleName: { type: String, required: true },
                roleId: { type: String, required: true },
                requiredAmount: { type: Number, required: true },
            },
        ],
        required: true,
    },
});
exports.roleModel = mongoose_1.default.model("role", roleSchema, "role");
