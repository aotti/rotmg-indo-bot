const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');
const { getNext3Weeks } = require('../helper/dateTime');
const { weatherCityList } = require('../helper/weatherChoices');

async function registerCommands() {
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
                    name: 'player_all',
                    description: 'get all player ingfo (takes 1-2 minutes, more if your internet sux)'
                },
                // search 1 player
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'player_search',
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
                    name: 'player_insert',
                    description: 'insert new player (ADMIN ONLY)',
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
                    name: 'player_edit',
                    description: 'edit player ingfo (ADMIN ONLY)',
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
                    name: 'mabar_check',
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
                    name: 'mabar_set',
                    description: 'set reminder for mabar rotmeg (ADMIN ONLY)',
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
                // edit mabar schedule
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'mabar_edit',
                    description: 'edit mabar schedule rotmeg (ADMIN ONLY)',
                    options: [
                        {
                            type: ApplicationCommandOptionType.Integer,
                            name: 'id',
                            description: 'mabar id',
                            required: true
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'status',
                            description: 'mabar status',
                            choices: [
                                { name: 'pending', value: 'pending' },
                                { name: 'done', value: 'done' }
                            ]
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
                },
                // add/remove role "agak wawan"
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'wawan_ping',
                    description: 'add/remove "agak wawan" role to user',
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'status',
                            description: 'role status',
                            required: true,
                            choices: [
                                { name: 'ON', value: 'ON' },
                                { name: 'OFF', value: 'OFF' }
                            ]
                        }
                    ]
                },
                // weather report
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'weather',
                    description: 'weather report in Indonesia',
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'city',
                            description: 'get weather report from chosen city',
                            required: true,
                            choices: weatherCityList()
                        },
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'type',
                            description: 'report time',
                            required: true,
                            choices: [
                                { name: 'Today', value: 'current' },
                                { name: 'Tomorrow', value: 'forecast' }
                            ]
                        },
                        {
                            type: ApplicationCommandOptionType.Boolean,
                            name: 'display',
                            description: 'display normal message (false) / dismiss-able (true) (ADMIN ONLY)'
                        }
                    ]
                }
            ]
        }
    ]
    
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN)
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

module.exports = registerCommands