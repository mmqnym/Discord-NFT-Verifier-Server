import {
  ActivityType,
  Client,
  GatewayIntentBits,
  TextChannel,
  EmbedBuilder,
  Routes,
} from "discord.js";
import { REST } from "@discordjs/rest";
import configs from "../configs.json";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const commands = [
  {
    name: "reload",
    description: "Reload the role settings.",
  },
];

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
        { name: "Name", value: member.toString() },
        {
          name: "Account",
          value: `[${walletAddress}](https://cronoscan.com/address/${walletAddress})`,
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
          { name: "Name", value: member.toString() },
          {
            name: "Account",
            value: `[${walletAddress}](https://cronoscan.com/address/${walletAddress})`,
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

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  if (interaction.commandName === "reload") {
    /* reload db
    ...
    */
    await interaction.reply({
      content: "The role settings have been reloaded.",
    });
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
    } catch (error) {
      console.error(error);
    }
  })();
});
