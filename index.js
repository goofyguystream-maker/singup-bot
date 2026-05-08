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

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = "1502265484673024100";

// CONFIG
const MAX = 10;
const SESSION_TIME = 10 * 60 * 1000; // 10 mins
const COOLDOWN_TIME = 60 * 60 * 1000; // 1 hour

let users = [];
let panelMessage = null;
let sessionActive = false;
let loopRunning = false;

// SAFETY
if (!TOKEN) {
  console.error("❌ TOKEN missing in Railway Variables");
  process.exit(1);
}

// BOT READY
client.once("clientReady", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  let channel;
  try {
    channel = await client.channels.fetch(CHANNEL_ID);
  } catch (err) {
    console.error("❌ Invalid CHANNEL ID");
    return;
  }

  // START LOOP ONLY ONCE
  if (!loopRunning) {
    loopRunning = true;
    runLoop(channel);
  }
});

// MAIN LOOP (NO TIMER BUGS)
async function runLoop(channel) {
  while (true) {
    await startSession(channel);

    await sleep(SESSION_TIME);

    await endSession(channel);

    await sleep(COOLDOWN_TIME);
  }
}

// START SESSION
async function startSession(channel) {
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
}

// END SESSION
async function endSession(channel) {
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
}

// BUTTON HANDLER
client.on("interactionCreate", async (interaction) => {
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
        content: "Slots are full!",
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
});

// SLEEP FUNCTION
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

client.login(TOKEN);
