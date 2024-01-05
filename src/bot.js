const { Client, IntentsBitField } = require('discord.js');
const { replyMessage } = require('./replyMessages');
const { greetingsReminder, indonesiaDate } = require('./reminder');
require('dotenv').config()
require('./register-commands')

// Initialize Discord Bot
const bot = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
});

// log message when bot online
bot.on('ready', (b) => {
    console.log(`${b.user.tag} is online at ${indonesiaDate().locale}`);
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

// listen to any message by user
// bot.on('messageCreate', (message) => {
//     // prevent bot from reply its own messages
//     if(message.author.bot) return
//     // reply to user message
//     if(message.content == 'kk lobster') {
//         message.reply('pasti uwu :flushed:')
//     }
// })

// make bot comes online
bot.login(process.env.TOKEN)