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
// It reloads in every period.
let roleInfos = [];
/**
 * Set up the database and login to the discord client.
 */
(async () => {
    await database_1.Database.connect();
    roleInfos = await database_1.Database.fetchRoleInfos();
    await bot_1.client.login(configs_json_1.default.discordToken);
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
            const recordedRoles = await (0, verification_1.verify)(request.body.walletAddress, roleInfos);
            const willAssignRoleIds = (0, verification_1.rolesToIdsString)(recordedRoles);
            const userDiscordId = request.body.userId;
            const userWalletAddress = request.body.walletAddress;
            let successOnInsertDB = false;
            let successOnAssignRoles = false;
            if (recordedRoles.length > 0) {
                successOnInsertDB = await database_1.Database.createUser(userDiscordId, userWalletAddress, willAssignRoleIds);
                if (successOnInsertDB) {
                    successOnAssignRoles = await (0, bot_1.assignRoles)(userWalletAddress, userDiscordId, willAssignRoleIds);
                }
                if (successOnInsertDB && successOnAssignRoles) {
                    response.status(201).json({
                        message: "The user will get the below role(s) soon.",
                        roles: recordedRoles,
                    });
                }
                else {
                    response.status(400).json({
                        message: "Failed to give role(s) or the user is not on our server.",
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
const server = app.listen(configs_json_1.default.serverPort, () => {
    console.log(`server is running on port: ${configs_json_1.default.serverPort}`);
});
process.once("SIGINT", async () => {
    await database_1.Database.disconnect();
    bot_1.client.destroy();
    server.close();
    console.log("Server is closed.");
});
