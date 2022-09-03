import {
  ActivityType,
  Client,
  GatewayIntentBits,
  TextChannel,
  EmbedBuilder,
} from "discord.js";
import configs from "../configs.json";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once("ready", () => {
  console.log(`logged in as ${client.user?.tag}`);
  client.user?.setActivity("Kaiju of Cronos", { type: ActivityType.Watching });
});

export const assignRoles = async (
  walletAddress: string,
  userId: string,
  roleIds: Array<string>
): Promise<boolean> => {
  try {
    const guild = await client.guilds.fetch(configs.discordGuildId);
    const member = await guild?.members.fetch(userId);
    let roleTags: Array<string> = [];

    for (let i = 0; i < roleIds.length; i++) {
      await member?.roles.add(roleIds[i]);
      roleTags.push(`<@&${roleIds[i]}>`);
    }

    const channel = (await client.channels.fetch(
      configs.discordLogChannelId
    )) as TextChannel;

    const embed = new EmbedBuilder()
      .setColor(0x6552a3)
      .setTitle("Member Updated")
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
        { name: "Roles", value: `${roleTags}` }
      )
      .setTimestamp()
      .setFooter({
        text: "Kaiju Verifier",
      });

    await channel?.send({ embeds: [embed] });
    return true;
  } catch {
    console.log("Failed to give role(s) or the user is not on our server.");
    return false;
  }
};
