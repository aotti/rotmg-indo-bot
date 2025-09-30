const { Client, IntentsBitField } = require('discord.js');
const { replyMessage } = require('./replyMessages');
const { greetingsReminder, indonesiaDate } = require('./reminder');
const regCommands = require('./register-commands');
const { fetcherWebhook } = require('../helper/fetcher');
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
bot.on('clientReady', (b) => {
    console.log(`${b.user.tag} is online at ${indonesiaDate().locale}`);
    // set custom status (activity)
    b.user.setActivity('/indog')
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

// member join notif
bot.on('guildMemberAdd', (b) => {
    b.guild.channels.cache.get(process.env.GENERAL_CHANNEL).send('ada yg joinan gays :eyes:')
})

// member leave notif
bot.on('guildMemberRemove', (b) => {
    const username = b.nickname || b.displayName
    b.guild.channels.cache.get(process.env.GENERAL_CHANNEL).send(`si **${username}** leave gays :skull:`)
})

// handle discord API error
process.on('unhandledRejection', async (error) => {
    console.log(error);
    await fetcherWebhook('discord interact api', error)
})

// make bot comes online
bot.login(process.env.TOKEN)