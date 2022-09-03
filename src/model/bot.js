"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignRoles = exports.client = void 0;
const discord_js_1 = require("discord.js");
const configs_json_1 = __importDefault(require("../configs.json"));
exports.client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildMembers,
    ],
});
exports.client.once("ready", () => {
    console.log(`logged in as ${exports.client.user?.tag}`);
    exports.client.user?.setActivity("Kaiju of Cronos", { type: discord_js_1.ActivityType.Watching });
});
const assignRoles = async (walletAddress, userId, roleIds) => {
    try {
        const guild = await exports.client.guilds.fetch(configs_json_1.default.discordGuildId);
        const member = await guild?.members.fetch(userId);
        let roleTags = [];
        for (let i = 0; i < roleIds.length; i++) {
            await member?.roles.add(roleIds[i]);
            roleTags.push(`<@&${roleIds[i]}>`);
        }
        const channel = (await exports.client.channels.fetch(configs_json_1.default.discordLogChannelId));
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x6552a3)
            .setTitle("Member Updated")
            .setAuthor({
            name: "Kaiju Verifier",
            iconURL: "https://kaijuofcronos.com/img/FINAL_KAIJU_TALISMAN_small.png",
            url: "https://kaijuofcronos.com/",
        })
            .addFields({ name: "Name", value: member.toString() }, {
            name: "Account",
            value: `[${walletAddress}](https://cronoscan.com/address/${walletAddress})`,
        }, { name: "Roles", value: `${roleTags}` })
            .setTimestamp()
            .setFooter({
            text: "Kaiju Verifier",
        });
        await channel?.send({ embeds: [embed] });
        return true;
    }
    catch {
        console.log("Failed to give role(s) or the user is not on our server.");
        return false;
    }
};
exports.assignRoles = assignRoles;
