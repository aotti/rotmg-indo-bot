const DiscordCommands = require('./classes/DiscordCommands');
const PlayerCommands = require('./classes/PlayerCommands');
const MabarCommands = require('./classes/MabarCommands');
const MiscCommands = require('./classes/MiscCommands');
const { fetcherWebhook } = require('../helper/fetcher');
const FanartCommands = require('./classes/FanartCommands');

const fanartCommandStarted = []

async function replyMessage(interact) {
    const discordCommands = new DiscordCommands(interact)
    const playerCommands = new PlayerCommands(interact)
    const mabarCommands = new MabarCommands(interact)
    const miscCommands = new MiscCommands(interact)
    const fanartCommands = new FanartCommands(interact)
    // reply to user who interacted with slash commands
    const discordUsername = interact.member.nickname || interact.user.displayName
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
            const subCommand = interact.options.getSubcommand()
            switch(subCommand) {
                // sub command
                case 'discord_link':
                    console.log(discordUsername, `> starting ${subCommand} command`);
                    discordCommands.discord_link()
                    break
                case 'discord_unlink':
                    console.log(discordUsername, `> starting ${subCommand} command`);
                    discordCommands.discord_unlink()
                    break
                case 'player_sync':
                    console.log(discordUsername, `> starting ${subCommand} command`);
                    playerCommands.player_sync()
                    break
                case 'player_all':
                    console.log(discordUsername, `> starting ${subCommand} command`);
                    playerCommands.player_all()
                    break
                case 'player_search':
                    console.log(discordUsername, `> starting ${subCommand} command`);
                    playerCommands.player_search()
                    break
                case 'player_notlocal':
                    console.log(discordUsername, `> starting ${subCommand} command`);
                    playerCommands.player_notlocal()
                    break
                case 'player_deaths': 
                    console.log(discordUsername, `> starting ${subCommand} command`);
                    playerCommands.player_deaths()
                    break
                case 'player_death_alarm': 
                    console.log(discordUsername, `> starting ${subCommand} command`);
                    playerCommands.player_death_alarm()
                    break
                case 'player_insert':
                    console.log(discordUsername, `> starting ${subCommand} command`);
                    playerCommands.player_insert()
                    break
                case 'player_edit':
                    console.log(discordUsername, `> starting ${subCommand} command`);
                    playerCommands.player_edit()
                    break
                case 'mabar_check':
                    console.log(discordUsername, `> starting ${subCommand} command`);
                    mabarCommands.mabar_check()
                    break
                case 'mabar_set':
                    console.log(discordUsername, `> starting ${subCommand} command`);
                    mabarCommands.mabar_set()
                    break
                case 'mabar_edit':
                    console.log(discordUsername, `> starting ${subCommand} command`);
                    mabarCommands.mabar_edit()
                    break
                case 'wawan_ping':
                    console.log(discordUsername, `> starting ${subCommand} command`);
                    miscCommands.wawan_ping()
                    break
                case 'weather':
                    console.log(discordUsername, `> starting ${subCommand} command`);
                    miscCommands.weather()
                    break
                case 'nerd': 
                    console.log(discordUsername, `> starting ${subCommand} command`);
                    miscCommands.nerd()
                    break
                case 'get_posted_fanart':
                    console.log(discordUsername, `> starting ${subCommand} command`);
                    fanartCommands.postedFanart()
                    break
                case 'get_new_fanart': 
                    console.log(discordUsername, `> starting ${subCommand} command`);
                    // check if fanart command is started
                    if(fanartCommandStarted.length === 0) {
                        fanartCommandStarted.push(discordUsername)
                        fanartCommands.getNewFanart()
                        // reset fanart command started
                        .then(result => {
                            if(result == 'fanart done') {
                                fanartCommandStarted.pop()
                                console.log(result)
                            }
                        })
                    }
                    else await interact.reply({ content: `${fanartCommandStarted[0]} already run this command` })
                    break
            }
            break
    }
}

module.exports = {
    replyMessage
}