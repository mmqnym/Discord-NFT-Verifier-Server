"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const configs_json_1 = __importDefault(require("../configs.json"));
const role_1 = require("./models/role");
const user_1 = require("./models/user");
exports.Database = {
    /**
     * Connect to the database.
     */
    connect: async () => {
        try {
            await mongoose_1.default.connect(configs_json_1.default.mongoDBUri);
            console.log("Database is connected.");
        }
        catch (error) {
            console.error(error);
            throw "Can not connect database.";
        }
    },
    /**
     * Disconnect to the database.
     */
    disconnect: async () => {
        try {
            await mongoose_1.default.disconnect();
            console.log("Database is disconnected.");
        }
        catch (error) {
            console.error(error);
            throw "Can not disconnect database.";
        }
    },
    /**
     * Fetch role settings by the devloper.
     *
     * @returns role settings
     */
    fetchRoleSettings: async () => {
        try {
            const result = await role_1.roleModel.find({});
            return result;
        }
        catch (error) {
            console.error(`When call fetchRoleSettings: ${error}`);
            return [];
        }
    },
    /**
     * Update the user record if the user discord id already exists in the database, otherwise create a new user record.
     *
     * @param newDiscordId The user's id.
     * @param newWalletAddress The user's account.
     * @param newRoleIds The group of role ids that the user will be assigned.
     * @returns Success
     */
    createUser: async (newDiscordId, newWalletAddress, newRoleIds) => {
        try {
            await user_1.userModel.replaceOne({ discordId: newDiscordId }, {
                discordId: newDiscordId,
                walletAddress: newWalletAddress,
                roleIds: newRoleIds,
            }, {
                upsert: true,
            });
        }
        catch (error) {
            console.error(error);
            return false;
        }
        return true;
    },
    /**
     * Fetch verified user records.
     *
     * @returns user records
     */
    fetchUsers: async () => {
        try {
            const result = await user_1.userModel.find({});
            return result;
        }
        catch (error) {
            console.error(error);
            return [];
        }
    },
};
