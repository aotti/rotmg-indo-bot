const { REST, Routes, ApplicationCommandOptionType } = require('discord.js')

const commands = [
    {
        name: 'greetings',
        description: 'the bot greets you'
    },
    {
        name: 'indog',
        description: 'player commands',
        options: [
            // search 1 player
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'search',
                description: 'check if the player exists',
                options: [
                    {
                        type: ApplicationCommandOptionType.String,
                        name: 'username',
                        description: 'player ingame name',
                        required: true
                    }
                ]
            },
            // insert new player
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'insert',
                description: 'insert new player',
                options: [
                    {
                        type: ApplicationCommandOptionType.String,
                        name: 'username',
                        description: 'player ingame name',
                        required: true
                    },
                    {
                        type: ApplicationCommandOptionType.String,
                        name: 'alias',
                        description: 'nama awiwi 😳'
                    },
                    {
                        type: ApplicationCommandOptionType.String,
                        name: 'region',
                        description: 'tempat niggal 😎'
                    }
                ]
            },
            // edit player info
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'edit',
                description: 'edit player ingfo',
                options: [
                    {
                        type: ApplicationCommandOptionType.String,
                        name: 'username',
                        description: 'player ingame name',
                        required: true
                    },
                    {
                        type: ApplicationCommandOptionType.String,
                        name: 'alias',
                        description: 'nama awiwi 😳'
                    },
                    {
                        type: ApplicationCommandOptionType.String,
                        name: 'region',
                        description: 'tempat niggal 😎'
                    },
                    {
                        type: ApplicationCommandOptionType.String,
                        name: 'new_username',
                        description: 'ganti ingame name'
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