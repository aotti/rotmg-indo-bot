require('dotenv').config()

const { REST, Routes, ApplicationCommandOptionType } = require('discord.js')

const commands = [
    {
        name: 'greetings',
        description: 'the bot greets you'
    },
    {
        name: 'find',
        description: 'check if the player exists',
        options: [
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'player',
                description: 'check if the player exists',
                options: [
                    {
                        type: ApplicationCommandOptionType.String,
                        name: 'username',
                        description: 'player ingame name',
                        required: true
                    }
                ]
            }
        ]
    }
]

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN)

async function registerCommands() {
    try {
        console.log('preparing commands');
        // set commands for the bot
        await rest.put(
            Routes.applicationGuildCommands(process.env.BOT_ID, process.env.GUILD_ID),
            { body: commands }
        )
        console.log('commands prepared');
    } catch (error) {
        console.log(`there was an error: ${error}`);
    }
}
registerCommands()