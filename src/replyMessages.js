const DiscordCommands = require('./classes/DiscordCommands');
const PlayerCommands = require('./classes/PlayerCommands');
const MabarCommands = require('./classes/MabarCommands');
const MiscCommands = require('./classes/MiscCommands');
const { fetcherWebhook } = require('../helper/fetcher');

async function replyMessage(interact) {
    const discordCommands = new DiscordCommands(interact)
    const playerCommands = new PlayerCommands(interact)
    const mabarCommands = new MabarCommands(interact)
    const miscCommands = new MiscCommands(interact)
    // reply to user who interacted with slash commands
    const discordUsername = interact.member.nickname || this.interact.user.displayName
    switch(interact.commandName) {
        case 'greetings':
            console.log(discordUsername, '> starting greetings command');
            try {
                const randReply = Math.round(Math.random()) === 1 
                                ? 'kk lobster syuki 🥰' 
                                : 'kk lobster kirai <:tsundere:1186674638093295616>'
                await interact.reply({ content: randReply })
            } catch (error) {
                console.log(error);
                await fetcherWebhook(interact.commandName, error)
            }
            break
        // main command
        case 'indog':
            switch(interact.options.getSubcommand()) {
                // sub command
                case 'discord_link':
                    console.log(discordUsername, '> starting discord_link command');
                    discordCommands.discord_link()
                    break
                case 'discord_unlink':
                    console.log(discordUsername, '> starting discord_unlink command');
                    discordCommands.discord_unlink()
                    break
                case 'player_all':
                    console.log(discordUsername, '> starting player_all command');
                    playerCommands.player_all()
                    break
                case 'player_search':
                    console.log(discordUsername, '> starting player_search command');
                    playerCommands.player_search()
                    break
                case 'player_notlocal':
                    console.log(discordUsername, '> starting player_notlocal command');
                    playerCommands.player_notlocal()
                    break
                case 'player_deaths': 
                    console.log(discordUsername, '> starting player_deaths command');
                    playerCommands.player_deaths()
                    break
                case 'player_death_alarm': 
                    console.log(discordUsername, '> starting player_deaths command');
                    playerCommands.player_death_alarm()
                    break
                case 'player_insert':
                    console.log(discordUsername, '> starting player_insert command');
                    playerCommands.player_insert()
                    break
                case 'player_edit':
                    console.log(discordUsername, '> starting player_edit command');
                    playerCommands.player_edit()
                    break
                case 'mabar_check':
                    console.log(discordUsername, '> starting mabar_check command');
                    mabarCommands.mabar_check()
                    break
                case 'mabar_set':
                    console.log(discordUsername, '> starting mabar_set command');
                    mabarCommands.mabar_set()
                    break
                case 'mabar_edit':
                    console.log(discordUsername, '> starting mabar_edit command');
                    mabarCommands.mabar_edit()
                    break
                case 'wawan_ping':
                    console.log(discordUsername, '> starting wawan_ping command');
                    miscCommands.wawan_ping()
                    break
                case 'weather':
                    console.log(discordUsername, '> starting weather command');
                    miscCommands.weather()
                    break
                case 'nerd': 
                    console.log(discordUsername, '> starting nerd command');
                    miscCommands.nerd()
            }
            break
    }
}

module.exports = {
    replyMessage
}