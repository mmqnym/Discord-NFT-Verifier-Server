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
    fetchRoleInfos: async () => {
        try {
            const result = await role_1.roleModel.find({});
            return result;
        }
        catch (error) {
            throw `When call fetchRoleInfos: ${error}`;
        }
    },
    createUser: async (newDiscordId, newWalletAddress, newRoleIds) => {
        try {
            // if exists update it, else create one record
            await user_1.userModel.replaceOne({ discordId: newDiscordId }, {
                discordId: newDiscordId,
                walletAddress: newWalletAddress,
                roleIds: newRoleIds,
            }, {
                upsert: true,
            });
        }
        catch (error) {
            console.log(error);
            return false;
        }
        return true;
    },
    fetchUsers: async () => {
        try {
            const result = await user_1.userModel.find({});
            return result;
        }
        catch (error) {
            console.log(error);
            return undefined;
        }
    },
};
