import express, { Express, Request, Response } from "express";
import configs from "./configs.json";
import { verify, rolesToIdsString } from "./model/verification";
import { Database } from "./database/database";

// When the developer types a command, it can be reloaded.
let roleInfos: Array<v.VerifyInfo> = [];

(async () => {
  await Database.connect();
  roleInfos = await Database.fetchRoleInfos();
})();

const port = configs.serverPort;
const clientURL = configs.clientURL;

const app: Express = express();

app.use(express.json());

const setCorsHeader = (response: Response): Response => {
  response.header("Access-Control-Allow-Origin", clientURL);
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
      const recordedRoles = await verify(request.body.walletAddress);
      const willAssignRoleIds = rolesToIdsString(recordedRoles);

      if (recordedRoles.length > 0) {
        await Database.createUser(
          request.body.userID,
          request.body.walletAddress,
          willAssignRoleIds
        );

        response.status(201).json({
          message: "The user will get the below role(s) soon.",
          roles: recordedRoles,
        });
      } else {
        response.status(200).json({
          message: "The user don't have the NFT(s) we set!",
          roles: [],
        });
      }
    })();
  } catch (error: any) {
    console.log(error);
    response.status(500).json({
      message: error.message,
      roles: [],
    });
  }
});

let server = app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
});

process.on("SIGINT", () => {
  server.close(async () => {
    await Database.disconnect();
    console.log("\nServer closed.");
  });
});
