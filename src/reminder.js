const { EmbedBuilder } = require("discord.js");
const { queryBuilder, selectOne, selectAll } = require("../database/databaseQueries");
const { indonesiaDate, convertTime12to24 } = require("../helper/dateTime");
const { fetcherReminder } = require("../helper/fetcher");
const regCommands = require('./register-commands')

async function greetingsReminder(bot) {
    try {
        const channel = await bot.channels.fetch(process.env.GENERAL_CHANNEL)
        // get players with death alarm
        const deathQuery = queryBuilder('players', 13, 'death', true)
        const selectDeaths = await selectAll(deathQuery)
        
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
        const reminderEndpoint = 'https://jadwalsholat.org/jadwal-sholat/daily.php?id=308'
        const fetchOptions = { method: 'GET' }
        // get reminder schedules
        const reminderResult = await fetcherReminder(reminderEndpoint, fetchOptions)
        // send message ONCE PER DAY based on scheduled time
        let interval = 3_600_000 // 25mins = 1_500_000, 30mins = 1_800_000, 60mins = 3_600_000
        let startInterval = setInterval(() => { reminderInterval() }, interval);
        async function reminderInterval() {
            // get current time 
            const currentTime = indonesiaDate().locale.split(' ').slice(1).join(' ')
            // get only the hours 
            const currentHours = +convertTime12to24(currentTime).split(':')[0]
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
                    // death reminder on selamat pingsan
                    if(currentHours === 22) await deathReminder(bot, selectDeaths)
                    // ping wawan role
                    const wawanRole = '<@&1185102820769280091>'
                    // pagi / pingsan time
                    const komariGIF = reminderResult.names[i] == 'pagi' 
                                        ? 'https://tenor.com/b6iqmZt0yYD.gif'
                                        : reminderResult.names[i] == 'pingsan'
                                            ? 'https://tenor.com/ti1FOaBMIK3.gif'
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
            const scrape = require('graveyard-scrape').scrapeGraveyard
            // death embed
            const deathsEmbed = new EmbedBuilder()
                .setTitle('Latest Indog Deaths')
                .setDescription('daftar player yang meninggal hari ini :skull:')
            // player list
            let deathCounter = 0
            const dateNow = new Date().getDate()
            for(let death of selectDeaths.data) {
                const playerGrave = await scrape(death.username, 1)
                // check graveyard date
                if(new Date(playerGrave[0].death_date).getDate() === dateNow) {
                    deathCounter++
                    // death info
                    const deathInfo = `**class:** ${playerGrave[0].class}
                                        **stats:** ${playerGrave[0].death_stats}
                                        **base:** ${playerGrave[0].base_fame} Fame
                                        **total:** ${playerGrave[0].total_fame} Fame
                                        **killed by:** ${playerGrave[0].killed_by}`
                    deathsEmbed.addFields({
                        name: death.username,
                        value: deathInfo
                    })
                }
            }
            deathsEmbed.setTimestamp()
            // if no one died graveyard
            if(deathCounter === 0) {
                return await channel.send({ 
                    content: 'Mengapa tydac ada yg pingsan hari ini? :sob:\n run `/death_alarm` agar graveyard klean bisa masuk alarm', 
                    flags: '4096' 
                })
            }
            // send embed
            await channel.send({ embeds: [deathsEmbed], flags: '4096' })
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