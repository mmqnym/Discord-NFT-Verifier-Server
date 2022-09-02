import mongoose from "mongoose";
import configs from "../configs.json";

import { roleModel } from "./models/role";
import { userModel } from "./models/user";

export const Database = {
  connect: async () => {
    try {
      await mongoose.connect(configs.mongoDBUri);
      console.log("Database is connected.");
    } catch (_) {
      throw "Can not connect database.";
    }
  },
  disconnect: async () => {
    try {
      await mongoose.disconnect();
      console.log("Database is disconnected.");
    } catch (_) {
      throw "Can not disconnect database.";
    }
  },
  fetchRoleInfos: async (): Promise<v.VerifyInfo[]> => {
    try {
      const result = await roleModel.find({});
      return result;
    } catch (error) {
      throw `When call fetchRoleInfos: ${error}`;
    }
  },
  createUser: async (
    newDiscordId: String,
    newWalletAddress: String,
    newRoleIds: Array<String>
  ): Promise<Boolean> => {
    try {
      // if exists update it, else create one record
      await userModel.replaceOne(
        { discordId: newDiscordId },
        {
          discordId: newDiscordId,
          walletAddress: newWalletAddress,
          roleIds: newRoleIds,
        },
        {
          upsert: true,
        }
      );
    } catch (error) {
      console.log(error);
      return false;
    }

    return true;
  },
};
