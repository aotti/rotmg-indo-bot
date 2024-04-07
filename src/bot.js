const { Client, IntentsBitField } = require('discord.js');
const { replyMessage } = require('./replyMessages');
const { greetingsReminder, indonesiaDate } = require('./reminder');
const regCommands = require('./register-commands')
require('dotenv').config()

// Initialize Discord Bot
const bot = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMembers
    ]
});

// log message when bot online
bot.on('ready', (b) => {
    console.log(`${b.user.tag} is online at ${indonesiaDate().locale}`);
    // set custom status (activity)
    setInterval(() => {
        b.user.setActivity('/indog')
    }, 3_600_000);
    // register commands
    regCommands()
    // send greeting message on morning, noon, afternoon, evening 
    greetingsReminder(bot)
})

// listen to any slash command
bot.on('interactionCreate', async (interact) => {
    // check if user really use slash command
    if(!interact.isChatInputCommand()) return
    // reply to user who interacted with slash commands
    replyMessage(interact)
})

// make bot comes online
bot.login(process.env.TOKEN)