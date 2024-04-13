const { queryBuilder, selectOne } = require("../database/databaseQueries");
const { indonesiaDate, convertTime12to24 } = require("../helper/dateTime");
const { fetcherReminder } = require("../helper/fetcher");
const regCommands = require('./register-commands')

function greetingsReminder(bot) {
    const channel = bot.channels.fetch(process.env.GENERAL_CHANNEL)
    channel.then(async result => {
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
        const fetchOptions = {
            method: 'GET'
        }
        // get reminder schedules
        const reminderResult = await fetcherReminder(reminderEndpoint, fetchOptions)
        // send message ONCE PER DAY based on scheduled time
        let interval = 3_600_000 // 25mins = 1_500_000, 30mins = 1_800_000, 60mins = 3_600_000
        let startInterval = setInterval(() => { reminderInterval() }, interval);
        function reminderInterval() {
            // get current time 
            const currentTime = indonesiaDate().locale.split(' ').slice(1).join(' ')
            // get only the hours 
            const currentHours = +convertTime12to24(currentTime).split(':')[0]
            // loop schedules
            for(let i in reminderResult.schedules) {
                const [scheduleHours, scheduleMinutes] = reminderResult.schedules[i].split(':')
                // the actual reminder 
                const reminderHours = +scheduleMinutes <= 30 ? +scheduleHours : +scheduleHours + 1
                // -1 hour before the actual reminder & only run when interval === 1 hour
                if(currentHours === (reminderHours - 1) && interval === 3_600_000) {
                    // restart the loop with 14mins interval
                    return restartInterval(840_000)
                }
                // currentHours === reminderHours (time)
                if(currentHours === reminderHours) {
                    // send mabar reminder once
                    mabarReminder(bot, reminderResult.names[i])
                    if(currentHours === 7) {
                        // register command to update mabar_set command date
                        regCommands()
                    }
                    // message
                    const wawanRole = '<@&1185102820769280091>'
                    // split the time (07:00) > get the hour > parse it to number > get the array index
                    const emojiIndex = reminderEmojis.map(v => { return v.name }).indexOf(reminderResult.names[i])
                    const reminderMessage = `${wawanRole}\nselamat ${reminderResult.names[i]}, bang ${reminderEmojis[emojiIndex].emoji}`
                    // send message
                    result.send(reminderMessage)
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
    })
    .catch(err => console.log(err))
}

// send notif when its the day for mabar
function mabarReminder(bot, timeName) {
    const channel = bot.channels.fetch(process.env.INDOG_EVENT_CHANNEL)
    channel.then(async result => {
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
            await result.send(`<@&496164930605547520>\nHari ini ada jadwal mabar **${title}**\nnote: ${description}`)
    })
    .catch(err => console.log(err))
}

module.exports = {
    greetingsReminder,
    indonesiaDate
}