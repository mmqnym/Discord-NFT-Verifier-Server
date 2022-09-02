"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const configs_json_1 = __importDefault(require("./configs.json"));
const verification_1 = require("./model/verification");
const database_1 = require("./database/database");
// When the developer types a command, it can be reloaded.
let roleInfos = [];
(async () => {
    await database_1.Database.connect();
    roleInfos = await database_1.Database.fetchRoleInfos();
})();
const port = configs_json_1.default.serverPort;
const clientURL = configs_json_1.default.clientURL;
const app = (0, express_1.default)();
app.use(express_1.default.json());
const setCorsHeader = (response) => {
    response.header("Access-Control-Allow-Origin", clientURL);
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
            const recordedRoles = await (0, verification_1.verify)(request.body.walletAddress);
            const willAssignRoleIds = (0, verification_1.rolesToIdsString)(recordedRoles);
            if (recordedRoles.length > 0) {
                await database_1.Database.createUser(request.body.userID, request.body.walletAddress, willAssignRoleIds);
                response.status(201).json({
                    message: "The user will get the below role(s) soon.",
                    roles: recordedRoles,
                });
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
        await database_1.Database.disconnect();
        console.log("\nServer closed.");
    });
});
