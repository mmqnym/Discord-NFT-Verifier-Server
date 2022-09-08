import express, { Express, Request, Response } from "express";
import configs from "./configs.json";
import { verify, rolesToIdsString } from "./model/verification";
import { Database } from "./database/database";
import {
  ActivityType,
  Client,
  GatewayIntentBits,
  TextChannel,
  EmbedBuilder,
  Routes,
} from "discord.js";
import { REST } from "@discordjs/rest";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Discord slash command
const commands = [
  {
    name: "reload",
    description: "Reload the role settings.",
  },
];

// Reload when the developer enters a command.
let roleSettings: Array<Verifying.RoleSettings> = [];

// It updates every once in a while
let verifiedUser: Array<Verified.User> = [];

/**
 * Set up the database and login to the discord client.
 */
(async () => {
  try {
    await Database.connect();
    roleSettings = await Database.fetchRoleSettings();
    verifiedUser = await Database.fetchUsers();

    if (roleSettings.length === 0) {
      throw "Server internal error when fetching role settings from the database.";
    }
    await client.login(configs.discord.token);
  } catch (error) {
    console.error("Initialization error!");
    throw error;
  }
})();

/**
 * When the user verifies through the front-end, give the roles.
 *
 * @param userId The user's discord id.
 * @param walletAddress The user's account.
 * @param roleIds The role ids user will be assigned.
 */
export const firstAssignRoles = async (
  userId: string,
  walletAddress: string,
  roleIds: Array<string>
): Promise<boolean> => {
  try {
    let roleAddTags: Array<string> = [];
    let guild = await client.guilds.fetch(configs.discord.guildId);
    let member = await guild?.members.fetch(userId);

    for (let i = 0; i < roleIds.length; i++) {
      await member?.roles.add(roleIds[i]);
      roleAddTags.push(`<@&${roleIds[i]}>`);
    }

    const channel = (await client.channels.fetch(
      configs.discord.logChannelId
    )) as TextChannel;

    const embed = new EmbedBuilder()
      .setColor(0x4a86d4)
      .setTitle("Member Verified")
      .setAuthor({
        name: "Kaiju Verifier",
        iconURL: "https://kaijuofcronos.com/img/FINAL_KAIJU_TALISMAN_small.png",
        url: "https://kaijuofcronos.com/",
      })
      .addFields(
        { name: "Name", value: member.toString(), inline: true },
        {
          name: "Account",
          value: `[${walletAddress.slice(0, 4)}...${walletAddress.slice(
            -4
          )}](https://cronoscan.com/address/${walletAddress})`,
          inline: true,
        },
        { name: "(+) Add Roles", value: `${roleAddTags}` }
      )
      .setTimestamp()
      .setFooter({
        text: "Kaiju Verifier",
      });

    await channel?.send({ embeds: [embed] });
    return true;
  } catch (error) {
    console.error("Failed to give role(s) or the user is not on our server.");
    console.error(error);
    return false;
  }
};

/**
 * Update the roles of a verified user.
 *
 * @param userId The user's discord id.
 * @param walletAddress The user's account.
 * @param oldRoleIds The user's old role ids.
 * @param newRoleIds The user's new role ids.
 * @returns Success
 */
export const updateRoles = async (
  userId: string,
  walletAddress: string,
  oldRoleIds: Array<string>,
  newRoleIds: Array<string>
): Promise<boolean> => {
  try {
    let roleAddTags: Array<string> = [];
    let roleRmTags: Array<string> = [];
    let guild = await client.guilds.fetch(configs.discord.guildId);
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
      const channel = (await client.channels.fetch(
        configs.discord.logChannelId
      )) as TextChannel;

      const embed = new EmbedBuilder()
        .setColor(0x6552a3)
        .setTitle("Member Updated")
        .setAuthor({
          name: "Kaiju Verifier",
          iconURL:
            "https://kaijuofcronos.com/img/FINAL_KAIJU_TALISMAN_small.png",
          url: "https://kaijuofcronos.com/",
        })
        .addFields(
          { name: "Name", value: member.toString(), inline: true },
          {
            name: "Account",
            value: `[${walletAddress.slice(0, 4)}...${walletAddress.slice(
              -4
            )}](https://cronoscan.com/address/${walletAddress})`,
            inline: true,
          }
        )
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
  } catch (error) {
    console.error("Failed to give role(s) or the user is not on our server.");
    console.error(error);
    return false;
  }
};

/**
 * According to the configs.discord.checkUserCycleTime,
 * check the wallets of verified users every time period,
 * update the database, and then assign roles to the users.
 */
let checkingUsersTimer = setTimeout(async function checkWallet() {
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

  checkingUsersTimer = setTimeout(
    checkWallet,
    configs.discord.checkUserCycleTime
  );
}, configs.discord.checkUserCycleTime);

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  if (
    interaction.commandName === "reload" &&
    interaction.user.id === configs.discord.ownerId
  ) {
    roleSettings.length = 0;
    roleSettings = await Database.fetchRoleSettings();

    console.log("new role settings:");
    console.log(roleSettings);

    const embed = new EmbedBuilder()
      .setColor(0xc44db6)
      .setTitle("Member Updated")
      .setAuthor({
        name: "Kaiju Verifier",
        iconURL: "https://kaijuofcronos.com/img/FINAL_KAIJU_TALISMAN_small.png",
        url: "https://kaijuofcronos.com/",
      })
      .setDescription(
        "The role settings have been reloaded, It will be updated in the next check cycle."
      )
      .setTimestamp()
      .setFooter({
        text: "Kaiju Verifier",
      });

    await interaction.reply({ embeds: [embed] });
  }
});

client.once("ready", () => {
  console.log(`logged in as ${client.user?.tag}`);
  client.user?.setActivity("Kaiju of Cronos", { type: ActivityType.Watching });

  const CLIENT_ID = client.user!.id;
  const rest = new REST({ version: "10" }).setToken(configs.discord.token);

  (async () => {
    try {
      await rest.put(Routes.applicationCommands(CLIENT_ID), {
        body: commands,
      });

      console.log("Successfully registering commands");
    } catch (error) {
      console.error(error);
    }
  })();
});

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

const server = app.listen(configs.serverPort, () => {
  console.log(`server is running on port: ${configs.serverPort}`);
});

process.once("SIGINT", async () => {
  clearInterval(checkingUsersTimer);
  await Database.disconnect();
  client.destroy();
  console.log("Log out of discord client.");
  server.close();
  console.log("Server is closed.");
});
