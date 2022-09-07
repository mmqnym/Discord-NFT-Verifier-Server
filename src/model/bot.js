"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRoles = exports.firstAssignRoles = exports.client = void 0;
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
/**
 * When the user verifies through the front-end, give the roles.
 *
 * @param userId The user's discord id.
 * @param walletAddress The user's account.
 * @param roleIds The role ids user will be assigned.
 */
const firstAssignRoles = async (userId, walletAddress, roleIds) => {
    try {
        let roleAddTags = [];
        let guild = await exports.client.guilds.fetch(configs_json_1.default.discord.guildId);
        let member = await guild?.members.fetch(userId);
        for (let i = 0; i < roleIds.length; i++) {
            await member?.roles.add(roleIds[i]);
            roleAddTags.push(`<@&${roleIds[i]}>`);
        }
        const channel = (await exports.client.channels.fetch(configs_json_1.default.discord.logChannelId));
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x4a86d4)
            .setTitle("Member Verified")
            .setAuthor({
            name: "Kaiju Verifier",
            iconURL: "https://kaijuofcronos.com/img/FINAL_KAIJU_TALISMAN_small.png",
            url: "https://kaijuofcronos.com/",
        })
            .addFields({ name: "Name", value: member.toString() }, {
            name: "Account",
            value: `[${walletAddress}](https://cronoscan.com/address/${walletAddress})`,
        }, { name: "(+) Add Roles", value: `${roleAddTags}` })
            .setTimestamp()
            .setFooter({
            text: "Kaiju Verifier",
        });
        await channel?.send({ embeds: [embed] });
        return true;
    }
    catch (error) {
        console.error("Failed to give role(s) or the user is not on our server.");
        console.error(error);
        return false;
    }
};
exports.firstAssignRoles = firstAssignRoles;
/**
 * Update the roles of a verified user.
 *
 * @param userId The user's discord id.
 * @param walletAddress The user's account.
 * @param oldRoleIds The user's old role ids.
 * @param newRoleIds The user's new role ids.
 * @returns Success
 */
const updateRoles = async (userId, walletAddress, oldRoleIds, newRoleIds) => {
    try {
        let roleAddTags = [];
        let roleRmTags = [];
        let guild = await exports.client.guilds.fetch(configs_json_1.default.discord.guildId);
        let member = await guild?.members.fetch(userId);
        // Remove roles that the user is no longer valid to obtain.
        for (let i = 0; i < oldRoleIds.length; i++) {
            if (!newRoleIds.includes(oldRoleIds[i])) {
                await member?.roles.remove(oldRoleIds[i]);
                roleRmTags.push(`<@&${oldRoleIds[i]}>`);
            }
        }
        // Add new role to the user.
        for (let i = 0; i < newRoleIds.length; i++) {
            if (!oldRoleIds.includes(newRoleIds[i])) {
                await member?.roles.add(newRoleIds[i]);
                roleAddTags.push(`<@&${newRoleIds[i]}>`);
            }
        }
        if (roleRmTags.length || roleAddTags.length) {
            const channel = (await exports.client.channels.fetch(configs_json_1.default.discord.logChannelId));
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
            })
                .setTimestamp()
                .setFooter({
                text: "Kaiju Verifier",
            });
            if (roleAddTags.length) {
                embed.addFields({ name: "(+) Add Roles", value: `${roleAddTags}` });
            }
            if (roleRmTags.length) {
                embed.addFields({ name: "(-) Remove Roles", value: `${roleRmTags}` });
            }
            await channel?.send({ embeds: [embed] });
        }
        return true;
    }
    catch (error) {
        console.error("Failed to give role(s) or the user is not on our server.");
        console.error(error);
        return false;
    }
};
exports.updateRoles = updateRoles;
