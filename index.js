const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder 
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ENV TOKEN (Railway)
const TOKEN = process.env.TOKEN;

// CONFIG
const CHANNEL_ID = "1502265484673024100";
const MAX = 10;
const SESSION_TIME = 10 * 60 * 1000;
const COOLDOWN_TIME = 60 * 60 * 1000;

let users = [];
let panelMessage = null;
let sessionActive = false;

// READY EVENT
client.once("clientReady", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  if (!CHANNEL_ID) {
    console.error("❌ CHANNEL_ID missing");
    return;
  }

  let channel;
  try {
    channel = await client.channels.fetch(CHANNEL_ID);
  } catch (err) {
    console.error("❌ Failed to fetch channel");
    console.error(err);
    return;
  }

  if (!channel) {
    console.error("❌ Channel not found");
    return;
  }

  startSession(channel);
});

// START SESSION
async function startSession(channel) {
  try {
    users = [];
    sessionActive = true;

    const embed = new EmbedBuilder()
      .setTitle("🟢 Registration Open")
      .setDescription("Current signed up: 0/10\n\nNo one yet")
      .setColor("Green");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("register")
        .setLabel("Register")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("cancel")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Danger)
    );

    panelMessage = await channel.send({
      embeds: [embed],
      components: [row]
    });

    console.log("🟢 Session started");

    setTimeout(() => endSession(channel), SESSION_TIME);

  } catch (err) {
    console.error("❌ Error starting session");
    console.error(err);
  }
}

// END SESSION
async function endSession(channel) {
  try {
    sessionActive = false;

    const list = users.map(id => `<@${id}>`).join("\n") || "No one";

    const embed = new EmbedBuilder()
      .setTitle("⛔ Registration Closed")
      .setDescription(`Final signed up: ${users.length}/${MAX}\n\n${list}\n\nSignup time is over!`)
      .setColor("Red");

    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("register")
        .setLabel("Register")
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),

      new ButtonBuilder()
        .setCustomId("cancel")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true)
    );

    if (panelMessage) {
      await panelMessage.edit({
        embeds: [embed],
        components: [disabledRow]
      });
    }

    console.log("🔴 Session ended");

    setTimeout(() => startSession(channel), COOLDOWN_TIME);

  } catch (err) {
    console.error("❌ Error ending session");
    console.error(err);
  }
}

// BUTTON HANDLER
client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isButton()) return;

    if (!sessionActive) {
      return interaction.reply({
        content: "⛔ Signup time is over!",
        ephemeral: true
      });
    }

    const userId = interaction.user.id;

    if (interaction.customId === "register") {
      if (users.includes(userId)) {
        return interaction.reply({
          content: "Already registered!",
          ephemeral: true
        });
      }

      if (users.length >= MAX) {
        return interaction.reply({
          content: "Slots full!",
          ephemeral: true
        });
      }

      users.push(userId);
    }

    if (interaction.customId === "cancel") {
      users = users.filter(id => id !== userId);
    }

    const list = users.map(id => `<@${id}>`).join("\n") || "No one yet";

    const embed = new EmbedBuilder()
      .setTitle("🟢 Registration Open")
      .setDescription(`Current signed up: ${users.length}/${MAX}\n\n${list}`)
      .setColor("Green");

    await interaction.update({ embeds: [embed] });

  } catch (err) {
    console.error("❌ Interaction error");
    console.error(err);
  }
});

// LOGIN (SAFE)
if (!TOKEN) {
  console.error("❌ TOKEN missing in Railway Variables");
} else {
  client.login(TOKEN).catch(err => {
    console.error("❌ Login failed (Invalid Token?)");
    console.error(err);
  });
}
