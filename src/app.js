"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const configs_json_1 = __importDefault(require("./configs.json"));
const verification_1 = require("./model/verification");
const port = configs_json_1.default.serverPort;
const clientURL = configs_json_1.default.clientURL;
const app = (0, express_1.default)();
app.use(express_1.default.json());
const setCorsHeader = (response) => {
    response.header("Access-Control-Allow-Origin", clientURL);
    response.header("Access-Control-Allow-Headers", "Content-Type");
    response.header("Access-Control-Allow-Methods", "POST");
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
        console.log(`Request from client IP Address: ${request.ip}`);
        (async () => {
            const recordedRoles = await (0, verification_1.process)(request.body.walletAddress);
            if (recordedRoles.length > 0) {
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
                console.log("hello");
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
app.listen(port, () => {
    console.log(`server is running on http://localhost:${port}`);
});
