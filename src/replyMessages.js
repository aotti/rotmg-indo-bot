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
    switch(interact.commandName) {
        case 'greetings':
            console.log(interact.member.nickname, '> starting greetings command');
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
                    console.log(interact.member.nickname, '> starting discord_link command');
                    discordCommands.discord_link()
                    break
                case 'discord_unlink':
                    console.log(interact.member.nickname, '> starting discord_unlink command');
                    discordCommands.discord_unlink()
                    break
                case 'player_all':
                    console.log(interact.member.nickname, '> starting player_all command');
                    playerCommands.player_all()
                    break
                case 'player_search':
                    console.log(interact.member.nickname, '> starting player_search command');
                    playerCommands.player_search()
                    break
                case 'player_notlocal':
                    console.log(interact.member.nickname, '> starting player_notlocal command');
                    playerCommands.player_notlocal()
                    break
                case 'player_deaths': 
                    console.log(interact.member.nickname, '> starting player_deaths command');
                    playerCommands.player_deaths()
                    break
                case 'player_death_alarm': 
                    console.log(interact.member.nickname, '> starting player_deaths command');
                    playerCommands.player_death_alarm()
                    break
                case 'player_insert':
                    console.log(interact.member.nickname, '> starting player_insert command');
                    playerCommands.player_insert()
                    break
                case 'player_edit':
                    console.log(interact.member.nickname, '> starting player_edit command');
                    playerCommands.player_edit()
                    break
                case 'mabar_check':
                    console.log(interact.member.nickname, '> starting mabar_check command');
                    mabarCommands.mabar_check()
                    break
                case 'mabar_set':
                    console.log(interact.member.nickname, '> starting mabar_set command');
                    mabarCommands.mabar_set()
                    break
                case 'mabar_edit':
                    console.log(interact.member.nickname, '> starting mabar_edit command');
                    mabarCommands.mabar_edit()
                    break
                case 'wawan_ping':
                    console.log(interact.member.nickname, '> starting wawan_ping command');
                    miscCommands.wawan_ping()
                    break
                case 'weather':
                    console.log(interact.member.nickname, '> starting weather command');
                    miscCommands.weather()
                    break
                case 'nerd': 
                    console.log(interact.member.nickname, '> starting nerd command');
                    miscCommands.nerd()
            }
            break
    }
}

module.exports = {
    replyMessage
}