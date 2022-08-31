import express, { Express, Request, Response } from "express";
import configs from "./configs.json";
import { process } from "./model/verification";

const port = configs.serverPort;
const clientURL = configs.clientURL;

const app: Express = express();

app.use(express.json());

const setCorsHeader = (response: Response): Response => {
  response.header("Access-Control-Allow-Origin", clientURL);
  response.header("Access-Control-Allow-Headers", "Content-Type");
  response.header("Access-Control-Allow-Methods", "POST");
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
    console.log(`Request from client IP Address: ${request.ip}`);

    (async () => {
      const recordedRoles = await process(request.body.walletAddress);

      if (recordedRoles.length > 0) {
        response.status(201).json({
          message: "The user will get the below role(s) soon.",
          roles: recordedRoles,
        });
      } else {
        response.status(200).json({
          message: "The user don't have the NFT(s) we set!",
          roles: [],
        });
        console.log("hello");
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

app.listen(port, () => {
  console.log(`server is running on http://localhost:${port}`);
});
