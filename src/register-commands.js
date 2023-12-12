const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');
const { getNext3Weeks } = require('../helper/dateChoices');

const commands = [
    {
        name: 'greetings',
        description: 'the bot greets you'
    },
    {
        name: 'indog',
        description: 'player commands',
        options: [
            // get all player
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'all_players',
                description: 'get all player ingfo (takes 1-2 minutes, more if your internet sux)'
            },
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
            },
            // mabar video
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'mabar_video',
                description: 'indog rotmeg mabar videos'
            },
            // get all mabar schedules
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'check_mabar',
                description: 'get all mabar schedules',
                options: [
                    {
                        type: ApplicationCommandOptionType.String,
                        name: 'status',
                        description: 'mabar schedule status',
                        required: true,
                        choices: [
                            { name: 'pending', value: 'pending' },
                            { name: 'done', value: 'done' }
                        ]
                    }
                ]
            },
            // set mabar schedule
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'set_mabar',
                description: 'set reminder for mabar rotmeg',
                options: [
                    {
                        type: ApplicationCommandOptionType.String,
                        name: 'title',
                        description: 'mabar title',
                        required: true
                    },
                    {
                        type: ApplicationCommandOptionType.String,
                        name: 'date',
                        description: 'when will the mabar occur (yyyy-mm-dd)',
                        required: true,
                        choices: getNext3Weeks()
                    },
                    {
                        type: ApplicationCommandOptionType.String,
                        name: 'description',
                        description: 'additional ingfo about the mabar'
                    }
                ]
            },
            // set mabar schedule
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'edit_mabar',
                description: 'edit mabar schedule rotmeg',
                options: [
                    {
                        type: ApplicationCommandOptionType.Integer,
                        name: 'id',
                        description: 'mabar id',
                        required: true
                    },
                    {
                        type: ApplicationCommandOptionType.String,
                        name: 'title',
                        description: 'mabar title'
                    },
                    {
                        type: ApplicationCommandOptionType.String,
                        name: 'date',
                        description: 'when will the mabar occur (yyyy-mm-dd)',
                        choices: getNext3Weeks()
                    },
                    {
                        type: ApplicationCommandOptionType.String,
                        name: 'description',
                        description: 'additional ingfo about the mabar'
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