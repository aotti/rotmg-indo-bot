const { EmbedBuilder } = require("discord.js");
const { queryBuilder, selectOne, selectAll } = require("../database/databaseQueries");
const { indonesiaDate, convertTime12to24 } = require("../helper/dateTime");
const { fetcherReminder, fetcherWebhook, fetchGraveyards } = require("../helper/fetcher");
const regCommands = require('./register-commands')

async function greetingsReminder(bot) {
    try {
        const channel = await bot.channels.fetch(process.env.GENERAL_CHANNEL)
        // help reminder
        const helpTimeRoll = (num) => {
            // num = range reminder time, 1 = 1~12h | 12 = 12~24h
            const time = Math.floor(Math.random() * 12) + num
            // prevent help time same as default reminder
            switch(time) {
                // -1 from schedule time to prevent the 14min loop
                // 7, 12, 15, 18, 19, 22
                case 6: case 11: case 14: case 17: case 18: case 21: 
                    return time + 1
                default: 
                    return time
            }
        }
        let helpTime = [helpTimeRoll(1), helpTimeRoll(12)]
        console.log({helpTime});
        // emojis
        const reminderEmojis = [
            { name: 'sahur', emoji: ':sleeping:' },
            { name: 'subuh', emoji: ':yawning_face:' },
            { name: 'siang', emoji: ':face_exhaling:' },
            { name: 'sore', emoji: ':sweat:' },
            { name: 'magrib', emoji: ':nerd:' },
            { name: 'isya', emoji: ':smirk_cat:' },
            { name: 'pagi', emoji: ':expressionless:' },
            { name: 'pingsan', emoji: ':sleeping:' }
        ]
        // get reminder schedules
        const reminderResult = {
            names: ['subuh', 'siang', 'sore', 'magrib', 'isya', 'pagi', 'pingsan'],
            schedules: ['05:00', '12:00', '15:00', '18:00', '19:10', '07:00', '22:00'],
        }
        // send message ONCE PER DAY based on scheduled time
        let interval = 3_600_000 // 25mins = 1_500_000, 30mins = 1_800_000, 60mins = 3_600_000
        let startInterval = setInterval(() => { reminderInterval() }, interval);
        async function reminderInterval() {
            // get players with death alarm
            const deathQuery = queryBuilder('players', 13, 'death', true)
            const selectDeaths = await selectAll(deathQuery)
            // get current time 
            const currentTime = indonesiaDate().locale.split(' ').slice(1).join(' ')
            // get only the hours 
            const currentHours = +convertTime12to24(currentTime).split(':')[0]
            // help time reminder
            if(currentHours === helpTime[0] || currentHours === helpTime[1]) {
                const helpContent = "Kalau klean terbingungan cara pake bot, silahkan cek <#1226420764497019040> 😳" +
                                    "\nUntuk ingfo apdet rotmeg, silahkan cek <#514997341464297491> 🥺" +
                                    "\nMuledump untuk exalt (buatan bang es 😳) <#1297453347800092682>"
                await channel.send({ 
                    content: helpContent, 
                    flags: '4096' 
                })
            }
            // loop schedules
            for(let i in reminderResult.schedules) {
                const [scheduleHours, scheduleMinutes] = reminderResult.schedules[i].split(':')
                // reminder hour
                const reminderHours = +scheduleMinutes <= 30 ? +scheduleHours : +scheduleHours + 1
                // -1 hour before the actual reminder & only run when interval === 1 hour
                if(currentHours === (reminderHours - 1) && interval === 3_600_000) {
                    // restart the loop with 14mins interval
                    return restartInterval(840_000)
                }
                // currentHours === reminderHours (time)
                if(currentHours === reminderHours) {
                    // send mabar reminder once
                    await mabarReminder(bot, reminderResult.names[i])
                    // register command to update mabar_set command date
                    if(currentHours === 7) await regCommands()
                    // reset reminder time
                    if(currentHours === 22) {
                        // help reminder reset between 7:00 ~ 21:00
                        helpTime = [helpTimeRoll(1), helpTimeRoll(12)]
                        // death reminder on selamat pingsan
                        await deathReminder(bot, selectDeaths)
                    }
                    // ping wawan role
                    const wawanRole = '<@&1185102820769280091>'
                    // pagi / pingsan time
                    const komariHost = 'https://cdn.discordapp.com/attachments/479503233157693443'
                    const komariGIF = reminderResult.names[i] == 'pagi' 
                                        ? `${komariHost}/1271488073301233726/terakomari-gandesblood-wake.gif`
                                        : reminderResult.names[i] == 'pingsan'
                                            ? `${komariHost}/1271488073754214461/terakomari-gandesblood-sleep.gif`
                                            : ''
                    // split the time (07:00) > get the hour > parse it to number > get the array index
                    const emojiIndex = reminderEmojis.map(v => { return v.name }).indexOf(reminderResult.names[i])
                    // message
                    const reminderMessage = `${wawanRole}\nselamat ${reminderResult.names[i]}, bang ${reminderEmojis[emojiIndex].emoji}\n${komariGIF}`
                    // send message
                    await channel.send(reminderMessage)
                    // restart the loop with 1 hour interval
                    console.log(currentTime, reminderResult.names[i]);
                    return restartInterval(3_600_000)
                }
            }
        }
        // restart interval
        function restartInterval(time) {
            // speed up interval (25mins) for precise reminder
            interval = time
            // stop the looping
            clearInterval(startInterval)
            // re-start the looping
            startInterval = setInterval(() => { reminderInterval() }, interval);
        }
    } catch (error) {
            console.log(error);
            await fetcherWebhook('reminder greetings', error)
    }
}

// send notif when its the day for mabar
async function mabarReminder(bot, timeName) {
    try {
        const channel = await bot.channels.fetch(process.env.INDOG_EVENT_CHANNEL)
        // get all pending mabar
        const currentDate = indonesiaDate().localeKR.replace(/\W\s/g, '-').split('.')[0]
        const query = queryBuilder('schedules', 45679, ['date', 'status'], [currentDate, 'pending'])
        const mabarResponse = await selectOne(query)
        // if data == null, do nothing
        if(mabarResponse.data[0] == null) return 
        // mabar data retrieved
        const { title, description, reminder_time } = mabarResponse.data[0]
        // match current hour and reminder time
        if(timeName === reminder_time)
            await channel.send(`<@&496164930605547520>\nHari ini ada jadwal mabar **${title}**\nnote: ${description}`)
    } catch (error) {
        console.log(error);
        await fetcherWebhook('reminder mabar', error)
    }
}

async function deathReminder(bot, selectDeaths) {
    try {
        const channel = await bot.channels.fetch(process.env.DEATH_CHANNEL)
        // database error
        if(selectDeaths.data === null) {
            await channel.send({ content: `death reminder error\n${JSON.stringify(selectDeaths.error)}`, flags: '4096' })
        }
        // get player data success
        else if(selectDeaths.error === null) {
            // get player graveyard
            // death embed
            const graveyardListEmbed = new EmbedBuilder()
                .setTitle('Latest Indog Deaths')
                .setDescription('daftar player yang meninggal hari ini :skull:')
                .setTimestamp()
            // player list
            const playerGraves = []
            // graveyard counter
            let deathCounter = 0
            const dateNow = new Date().toLocaleDateString()
            for(let death of selectDeaths.data) {
                // get graveyard data
                const graveyardUrl = `https://www.realmeye.com/graveyard-of-player/${death.username}`
                const graveyards = await fetchGraveyards(graveyardUrl, null)
                // is graveyard private
                const isGravePrivate = graveyards.length > 0 ? '✅' : '🔒'
                playerGraves.push(`${isGravePrivate} ${death.username}`)
                // check graveyard date
                for(let grave of graveyards) {
                    if(graveyards.length > 0 && new Date(grave.death_date).toLocaleDateString() === dateNow) {
                        deathCounter++
                        // death info
                        const deathInfo = `**class:** ${grave.class}
                                            **stats:** ${grave.death_stats}
                                            **base:** ${grave.base_fame} Fame
                                            **total:** ${grave.total_fame} Fame
                                            **killed by:** ${grave.killed_by}`
                        graveyardListEmbed.addFields({
                            name: death.username,
                            value: deathInfo,
                            inline: true
                        })
                    }
                }
            }
            // split player list
            const splitDeathPlayers = []
            const splitBase = 5
            const splitCounter = Math.ceil(playerGraves.length / splitBase)
            for(let i=0; i<splitCounter; i++) {
                const [sliceMin, sliceMax] = [i * splitBase, (i+1) * splitBase]
                splitDeathPlayers.push(playerGraves.slice(sliceMin, sliceMax))
            }
            // player list embed
            const playerListEmbed = new EmbedBuilder()
                .setTitle('Graveyard Status')
                .setDescription('🔒 - private | ✅ - public')
            for(let i in splitDeathPlayers) {
                playerListEmbed.addFields({
                    name: i == 0 ? 'Player List' : '** **',
                    value: splitDeathPlayers[i].join('\n'),
                    inline: true
                })
            }
            // ### PAKE DOBEL EMBEDS
            // ### EMBED 1 = PLAYER LIST | EMBED 2 = GRAVE LIST
            // if no one died graveyard
            if(deathCounter === 0) {
                graveyardListEmbed.addFields({
                    name: `Tidak ada yang meninggal hari ini :sob:`,
                    value: 'kalo mau graveyard klean muncul di daily reminder, run command **`/death_alarm`** tapi graveyard klean harus public di realmeye 💀 '
                })
                return await channel.send({ 
                    embeds: [playerListEmbed, graveyardListEmbed], 
                    flags: '4096' 
                })
            }
            // send embed
            await channel.send({ 
                embeds: [playerListEmbed, graveyardListEmbed], 
                flags: '4096' 
            })
        }
    } catch (error) {
        console.log(error);
        await fetcherWebhook('reminder death', error)
    }
}

module.exports = {
    greetingsReminder,
    indonesiaDate
}