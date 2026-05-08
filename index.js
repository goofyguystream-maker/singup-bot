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

const MAX = 10;
const SESSION_TIME = 10 * 60 * 1000;
const COOLDOWN_TIME = 60 * 60 * 1000;

let users = [];
let panelMessage = null;
let sessionActive = false;

client.once("clientReady", async () => {
    console.log(`Logged in as ${client.user.tag}`);
    const channel = await client.channels.fetch(1502265484673024100);
    startSession(channel);
});

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

    setTimeout(() => endSession(channel), SESSION_TIME);
}

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

    await panelMessage.edit({
        embeds: [embed],
        components: [disabledRow]
    });

    setTimeout(() => startSession(channel), COOLDOWN_TIME);
}

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    if (!sessionActive) {
        return interaction.reply({
            content: "Signup time is over!",
            ephemeral: true
        });
    }

    const userId = interaction.user.id;

    if (interaction.customId === "register") {
        if (users.includes(userId)) {
            return interaction.reply({ content: "Already registered!", ephemeral: true });
        }

        if (users.length >= MAX) {
            return interaction.reply({ content: "Slots full!", ephemeral: true });
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

client.login(TOKEN);
