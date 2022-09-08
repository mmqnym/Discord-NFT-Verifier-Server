import mongoose from "mongoose";
import configs from "../configs.json";

import { roleModel } from "./models/role";
import { userModel } from "./models/user";

export const Database = {
  /**
   * Connect to the database.
   */
  connect: async () => {
    try {
      await mongoose.connect(configs.mongoDBUri);
      console.log("Database is connected.");
    } catch (error) {
      console.error(error);
      throw "Can not connect database.";
    }
  },

  /**
   * Disconnect to the database.
   */
  disconnect: async () => {
    try {
      await mongoose.disconnect();
      console.log("Database is disconnected.");
    } catch (error) {
      console.error(error);
      throw "Can not disconnect database.";
    }
  },

  /**
   * Fetch role settings by the devloper.
   *
   * @returns role settings
   */
  fetchRoleSettings: async (): Promise<Verifying.RoleSettings[]> => {
    try {
      const result = await roleModel.find({});
      return result;
    } catch (error) {
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
  createUser: async (
    newDiscordId: string,
    newWalletAddress: string,
    newRoleIds: Array<string>
  ): Promise<boolean> => {
    try {
      if (!newDiscordId) return false;

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
  fetchUsers: async (): Promise<Array<Verified.User>> => {
    try {
      const result = await userModel.find({});
      return result;
    } catch (error) {
      console.error(error);
      return [];
    }
  },
};
