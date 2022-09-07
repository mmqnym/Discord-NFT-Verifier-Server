import express, { Express, Request, Response } from "express";
import configs from "./configs.json";
import { verify, rolesToIdsString } from "./model/verification";
import { Database } from "./database/database";
import { client, firstAssignRoles, updateRoles } from "./model/bot";

// Reload when the developer enters a command.
let roleSettings: Array<Verifying.RoleSettings> = [];

// It updates every once in a while
let verifiedUser: Array<Verified.User> = [];

/**
 * Set up the database and login to the discord client.
 */
(async () => {
  await Database.connect();
  roleSettings = await Database.fetchRoleSettings();
  verifiedUser = await Database.fetchUsers();

  if (roleSettings.length === 0 || verifiedUser.length === 0) {
    throw "Server internal error when fetching resources from the database";
  }
  await client.login(configs.discord.token);
})();

const app: Express = express();

app.use(express.json());

const setCorsHeader = (response: Response): Response => {
  response.header("Access-Control-Allow-Origin", configs.clientURL);
  response.header("Access-Control-Allow-Headers", "Content-Type");
  response.header("Access-Control-Allow-Methods", "POST");
  response.header("Access-Control-Max-Age", "300");
  return response;
};

app.options("/api/verify", (request: Request, response: Response) => {
  response = setCorsHeader(response);
  response.end();
});

app.post("/api/verify", (request: Request, response: Response) => {
  response = setCorsHeader(response);

  // Got a request from client.
  try {
    console.log(`>>> Request from client IP Address: ${request.ip}`);

    (async () => {
      const recordedRoles = await verify(
        request.body.walletAddress,
        roleSettings
      );

      const userDiscordId: string = request.body.userId;
      const userWalletAddress: string = request.body.walletAddress;
      let successOnInsertDB = false;
      let successOnAssignRoles = false;

      if (recordedRoles.length > 0) {
        const willAssignRoleIds: Array<string> =
          rolesToIdsString(recordedRoles);
        // Create or update user data in the database.
        successOnInsertDB = await Database.createUser(
          userDiscordId,
          userWalletAddress,
          willAssignRoleIds
        );

        if (successOnInsertDB) {
          successOnAssignRoles = await firstAssignRoles(
            userDiscordId,
            userWalletAddress,
            willAssignRoleIds
          );
        }

        if (successOnInsertDB && successOnAssignRoles) {
          response.status(201).json({
            message: "The user will get the below role(s) soon.",
            roles: recordedRoles,
          });
        } else {
          response.status(500).json({
            message: "When creating user data, some errors occured.",
            roles: [],
          });
        }
      } else {
        response.status(200).json({
          message: "The user don't have the NFT(s) we set!",
          roles: [],
        });
      }
    })();
  } catch (error) {
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
const server = app.listen(configs.serverPort, () => {
  console.log(`server is running on port: ${configs.serverPort}`);
});

process.once("SIGINT", async () => {
  //clearInterval(checkingUsersTimer);
  await Database.disconnect();
  client.destroy();
  console.log("Log out of discord client.");
  server.close();
  console.log("Server is closed.");
});
