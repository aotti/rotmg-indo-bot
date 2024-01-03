const { queryBuilder, selectOne } = require("../database/databaseQueries");
const { fetcherReminder } = require("../helper/fetcher");

// utc +7
const indonesiaDate = () => {
    const d = new Date()
    // utc time
    const localTime = d.getTime()
    const localOffset = d.getTimezoneOffset() * 60_000
    const utc = localTime + localOffset
    // indonesia time
    const indonesiaOffset = 7
    const indonesiaTime = utc + (3_600_000 * indonesiaOffset)
    const indonesiaNow = new Date(indonesiaTime)
    return {locale: indonesiaNow.toLocaleString(), localeKR: indonesiaNow.toLocaleDateString('ko-KR')}
}
// convert am/pm time to 24 hours
const convertTime12to24 = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
  
    if (hours === '12') {
      hours = '00';
    }
  
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
  
    return `${hours}:${minutes}`;
}

function greetingsReminder(bot) {
    const channel = bot.channels.fetch(process.env.GENERAL_CHANNEL)
    channel.then(async (result) => {
        // object to save greetings
        const todayGreetings = {
            subuh: false,
            pagi: false,
            siang: false,
            sore: false,
            magrib: false,
            isya: false,
            pingsan: false
        }
        const reminderEmojis = [
            ':yawning_face:', ':expressionless:', ':face_exhaling:',
            ':sweat:', ':nerd:', ':smirk_cat:', ':sleeping:'
        ]
        const reminderEndpoint = 'https://www.jadwalsholat.org/adzan/ajax/ajax.daily1.php?id=308'
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
            // proxy for detect object value changes
            const handlerTodayGreetings = {
                set(target, prop, value) {
                    target[prop] = value
                    console.log(currentTime, target);
                }
            }
            const proxyTodayGreetings = new Proxy(todayGreetings, handlerTodayGreetings)
            // loop schedules
            for(let i in reminderResult.schedules) {
                const [scheduleHours, scheduleMinutes] = reminderResult.schedules[i].split(':')
                // the actual reminder 
                const reminderHours = +scheduleMinutes <= 30 ? +scheduleHours : +scheduleHours + 1
                // -1 hour before the actual reminder
                // tambah kondisi interval === 3_600_000
                if(currentHours === (reminderHours - 1) && interval === 3_600_000) {
                    // restart the loop with 25mins interval
                    return restartInterval(1_500_000)
                }
                // check the condition (pagi/siang/sore) and time (07:00/12:00/15:00)
                const conditionKeys = Object.keys(todayGreetings)
                const conditionTime = conditionKeys.indexOf(reminderResult.names[i])
                // currentHours === reminderHours (time) & conditionTime !== -1 (condition) & todayGreetings.condition = false
                if(currentHours === reminderHours && conditionTime !== -1 && proxyTodayGreetings[conditionKeys[conditionTime]] === false) {
                    // message
                    const wawanRole = '<@&1185102820769280091>'
                    const reminderMessage = `${wawanRole}\nselamat ${reminderResult.names[i]}, bang ${reminderEmojis[conditionTime]}`
                    // set greetings to true, so the greetings only run 1x
                    proxyTodayGreetings[conditionKeys[conditionTime]] = true
                    // send message
                    result.send(reminderMessage)
                    // restart the loop with 1 hour interval
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
function mabarReminder(bot) {
    const channel = bot.channels.fetch(process.env.GENERAL_CHANNEL)
    channel.then(result => {
        // get all pending mabar
        const currentDate = indonesiaDate().localeKR.replace(/\W\s/g, '-').split('.')[0]
        new Promise(resolve => {
            const query = queryBuilder('schedules', 45678, ['date', 'status'], [currentDate, 'pending'])
            // get data ascending by date
            resolve(selectOne(query))
        })
        .then(payload => {
            if(payload.data[0] == null) return
            const { title, description } = payload.data[0]
            result.send(`<@&496164930605547520>\nHari ini ada jadwal mabar **${title}**\nnote: ${description}`)
        })
    })
    .catch(err => console.log(err))
}

module.exports = {
    greetingsReminder,
    mabarReminder,
    indonesiaDate
}