const { Client, IntentsBitField } = require('discord.js');
const supabase = require('../database/database')
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
    console.log(`${b.user.tag} is online`);
})

// listen to any slash command
bot.on('interactionCreate', (interact) => {
    // check if user really use slash command
    if(!interact.isChatInputCommand()) return
    // reply to user who interacted with slash commands
    switch(interact.commandName) {
        case 'greetings':
            interact.reply('selamat subuh, bang')
            break
        // main command
        case 'find':
            switch(interact.options.getSubcommand()) {
                // sub command
                case 'player':
                    // find player command
                    // get player input value
                    const inputUsername = interact.options.get('username').value.toLowerCase()
                    // find username in database
                    if(supabase == null)
                        return res.status(500).send('cannot connect to database')
                    // get data from supabase
                    const selectOneDataFromDB = async () => {
                        const {data, error} = await supabase.from('players')
                                            .select('username, alias, region')
                                            .eq('username', inputUsername)
                        return {data: data, error: error}
                    }
                    new Promise((resolve, reject) => {
                        resolve(selectOneDataFromDB())
                    })
                    .then(result => {
                        // if player not found
                        if(result.data.length === 0) {
                            // set reply message
                            const replyContent = "~~                                               ~~\n" + 
                            "**Player Not Found** :warning:\n" +
                            "~~                                               ~~\n" + 
                            "`username : " + inputUsername + "`\n" +
                            "`note: kalo memang ada player dgn username gituan, \nboleh bagi tau para admin biar ditambah ke list`"
                            return interact.reply({ content: replyContent, ephemeral: true })
                        }
                        // if error happen when doin queries
                        else if(result.error !== null) {
                            return console.log('error', result.error);
                        }
                        // get result data then destructure
                        console.log(result.data);
                        const { username, alias, region } = result.data[0]
                        // set reply message
                        const replyContent = "~~                                               ~~\n" + 
                        "**Player Found** :white_check_mark:\n" +
                        "~~                                               ~~\n" + 
                        "`username : " + username + "`\n" +
                        "`alias    : " + alias + "`\n" +
                        "`region   : " + region + "`"
                        // send reply message
                        interact.reply({ content: replyContent, ephemeral: true })
                    }).catch(err => console.log(err))
                    break
            }
            break
    }
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