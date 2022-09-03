import express, { Express, Request, Response } from "express";
import configs from "./configs.json";
import { verify, rolesToIdsString } from "./model/verification";
import { Database } from "./database/database";
import { client, assignRoles } from "./model/bot";

// It reloads in every period.
let roleInfos: Array<Verifying.VerifyInfo> = [];

/**
 * Set up the database and login to the discord client.
 */
(async () => {
  await Database.connect();
  roleInfos = await Database.fetchRoleInfos();
  await client.login(configs.discordToken);
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
      const recordedRoles = await verify(request.body.walletAddress, roleInfos);
      const willAssignRoleIds: Array<string> = rolesToIdsString(recordedRoles);
      const userDiscordId: string = request.body.userId;
      const userWalletAddress: string = request.body.walletAddress;
      let successOnInsertDB = false;
      let successOnAssignRoles = false;

      if (recordedRoles.length > 0) {
        successOnInsertDB = await Database.createUser(
          userDiscordId,
          userWalletAddress,
          willAssignRoleIds
        );

        if (successOnInsertDB) {
          successOnAssignRoles = await assignRoles(
            userWalletAddress,
            userDiscordId,
            willAssignRoleIds
          );
        }

        if (successOnInsertDB && successOnAssignRoles) {
          response.status(201).json({
            message: "The user will get the below role(s) soon.",
            roles: recordedRoles,
          });
        } else {
          response.status(400).json({
            message: "Failed to give role(s) or the user is not on our server.",
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
    console.log(error);
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

const server = app.listen(configs.serverPort, () => {
  console.log(`server is running on port: ${configs.serverPort}`);
});

process.once("SIGINT", async () => {
  await Database.disconnect();
  client.destroy();
  server.close();
  console.log("Server is closed.");
});
