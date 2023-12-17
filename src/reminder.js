const { queryBuilder, selectOne } = require("../database/databaseQueries");

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
    channel.then(result => {
        // object to save greetings
        const todayGreetings = {
            subuh: false,
            pagi: false,
            siang: false,
            sore: false,
            magrib: false,
            pingsan: false
        }
        // send message ONCE PER DAY based on scheduled time
        setInterval(() => {
            // get current time 
            const currentTime = new Date().toLocaleString().split(' ').slice(1).join(' ')
            // get only the hours 
            const currentHours = convertTime12to24(currentTime).split(':')[0]
            // send message
            switch(currentHours) {
                case '5':
                    if(todayGreetings.subuh === false) {
                        todayGreetings.subuh = true
                        result.send('<@&1185102820769280091>\nselamat subuh, bang :yawning_face:')
                    }
                    break
                case '7':
                    if(todayGreetings.pagi === false) {
                        todayGreetings.pagi = true
                        result.send('<@&1185102820769280091>\nselamat pagi, bang :expressionless:')
                    }
                    break
                case '12':
                    if(todayGreetings.siang === false) {
                        todayGreetings.siang = true
                        result.send('<@&1185102820769280091>\nselamat siang, bang :face_exhaling:')
                    }
                    break
                case '15':
                    if(todayGreetings.sore === false) {
                        todayGreetings.sore = true
                        result.send('<@&1185102820769280091>\nselamat sore, bang :sweat:')
                    }
                    break
                case '18':
                    if(todayGreetings.magrib === false) {
                        todayGreetings.magrib = true
                        result.send('<@&1185102820769280091>\nselamat magrib, bang :nerd:')
                    }
                    break
                case '22':
                    if(todayGreetings.pingsan === false) {
                        todayGreetings.pingsan = true
                        result.send('<@&1185102820769280091>\nselamat pingsan, bang :sleeping:')
                    }
                    break
            }
            console.log(currentTime, todayGreetings);
        }, 3_600_000); // 30 mins = 1_800_000
    })
    .catch(err => console.log(err))
}

// send notif when its the day for mabar
function mabarReminder(bot) {
    const channel = bot.channels.fetch(process.env.GENERAL_CHANNEL)
    channel.then(result => {
        // get all pending mabar
        const currentDate = new Date().toLocaleDateString('ko-KR').replace(/\W\s/g, '-').split('.')[0]
        new Promise(resolve => {
            const query = queryBuilder('schedules', 45678, 'date', currentDate)
            // get data ascending by date
            resolve(selectOne(query))
        })
        .then(payload => {
            if(payload.data[0] == null) return
            const { title, description } = payload.data[0]
            result.send(`@here\nHari ini ada jadwal mabar **${title}**\nnote: ${description}`)
        })
    })
    .catch(err => console.log(err))
}

module.exports = {
    greetingsReminder,
    mabarReminder
}