"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const configs_json_1 = __importDefault(require("./configs.json"));
const verification_1 = require("./model/verification");
const database_1 = require("./database/database");
const bot_1 = require("./model/bot");
// Reload when the developer enters a command.
let roleSettings = [];
// It updates every once in a while
let verifiedUser = [];
/**
 * Set up the database and login to the discord client.
 */
(async () => {
    await database_1.Database.connect();
    roleSettings = await database_1.Database.fetchRoleSettings();
    verifiedUser = await database_1.Database.fetchUsers();
    if (roleSettings.length === 0 || verifiedUser.length === 0) {
        throw "Server internal error when fetching resources from the database";
    }
    await bot_1.client.login(configs_json_1.default.discord.token);
})();
const app = (0, express_1.default)();
app.use(express_1.default.json());
const setCorsHeader = (response) => {
    response.header("Access-Control-Allow-Origin", configs_json_1.default.clientURL);
    response.header("Access-Control-Allow-Headers", "Content-Type");
    response.header("Access-Control-Allow-Methods", "POST");
    response.header("Access-Control-Max-Age", "300");
    return response;
};
app.options("/api/verify", (request, response) => {
    response = setCorsHeader(response);
    response.end();
});
app.post("/api/verify", (request, response) => {
    response = setCorsHeader(response);
    // Got a request from client.
    try {
        console.log(`>>> Request from client IP Address: ${request.ip}`);
        (async () => {
            const recordedRoles = await (0, verification_1.verify)(request.body.walletAddress, roleSettings);
            const userDiscordId = request.body.userId;
            const userWalletAddress = request.body.walletAddress;
            let successOnInsertDB = false;
            let successOnAssignRoles = false;
            if (recordedRoles.length > 0) {
                const willAssignRoleIds = (0, verification_1.rolesToIdsString)(recordedRoles);
                // Create or update user data in the database.
                successOnInsertDB = await database_1.Database.createUser(userDiscordId, userWalletAddress, willAssignRoleIds);
                if (successOnInsertDB) {
                    successOnAssignRoles = await (0, bot_1.firstAssignRoles)(userDiscordId, userWalletAddress, willAssignRoleIds);
                }
                if (successOnInsertDB && successOnAssignRoles) {
                    response.status(201).json({
                        message: "The user will get the below role(s) soon.",
                        roles: recordedRoles,
                    });
                }
                else {
                    response.status(500).json({
                        message: "When creating user data, some errors occured.",
                        roles: [],
                    });
                }
            }
            else {
                response.status(200).json({
                    message: "The user don't have the NFT(s) we set!",
                    roles: [],
                });
            }
        })();
    }
    catch (error) {
        console.error(error);
        let errMsg = "When doing verification some errors occured.";
        if (error instanceof Error) {
            errMsg = error.message;
        }
        response.status(500).json({
            message: errMsg,
            roles: [],
        });
    }
});
/**
 * According to the configs.discord.checkUserCycleTime,
 * check the wallets of verified users every time period,
 * update the database, and then assign roles to the users.
 */
/*
const checkingUsersTimer = setInterval(async () => {
  try {
    const oldUserData = await Database.fetchUsers();

    for (let i = 0; i < oldUserData.length; i++) {
      let successOnInsertDB = false;
      let successOnUpdateRoles = false;

      let newRecordedRoles = await verify(
        oldUserData[i].walletAddress,
        roleSettings
      );

      let willAssignRoleIds: Array<string> = rolesToIdsString(newRecordedRoles);

      // Update db.
      successOnInsertDB = await Database.createUser(
        oldUserData[i].discordId,
        oldUserData[i].walletAddress,
        willAssignRoleIds
      );

      // Assign discord roles.
      if (successOnInsertDB) {
        // Wait 1 secs, cuz using free API
        await (async () => {
          return new Promise((resolve) => setTimeout(resolve, 1000));
        })();

        successOnUpdateRoles = await updateRoles(
          oldUserData[i].discordId,
          oldUserData[i].walletAddress,
          oldUserData[i].roleIds,
          willAssignRoleIds
        );
      }

      if (!successOnInsertDB || !successOnUpdateRoles) {
        console.log(
          `When updating <@${oldUserData[i].discordId}>, error(s) occured.`
        );
      }
    }
  } catch (error) {
    console.error("Error(s) occured on checkingUsersTimer!");
    console.error(error);
  }
}, configs.discord.checkUserCycleTime);
*/
const server = app.listen(configs_json_1.default.serverPort, () => {
    console.log(`server is running on port: ${configs_json_1.default.serverPort}`);
});
process.once("SIGINT", async () => {
    //clearInterval(checkingUsersTimer);
    await database_1.Database.disconnect();
    bot_1.client.destroy();
    console.log("Log out of discord client.");
    server.close();
    console.log("Server is closed.");
});
