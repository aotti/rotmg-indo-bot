const { weatherMonthNames, weatherEmoji } = require("./weatherChoices")

function fetcherRealmEye(url, options, singleData = true) {
    return fetch(url, options)
    .then(data => { return data.json() })
    .then(realmeye => {
        // check if ProfileInfo exists
        const checkProfileInfo = realmeye.error == null
        if(singleData) {
            // data from api
            const { PlayerName, Rank, Guild, Created, FirstSeen, LastSeen } = realmeye.ProfileInfo
            // set reply message
            const api_resultObj = {
                username: PlayerName,
                rank: `${Rank} ☆`,
                guild: Guild,
                created: FirstSeen || Created,
                lastSeen: LastSeen,
                // prevent error from hidden profile on realmeye
                status: checkProfileInfo && +realmeye?.ProfileInfo.Fame.split(' ')[0] > 0 ? 'aktif' : 'quit'
            }
            return api_resultObj
        }
        else {
            // set reply message
            const api_resultObj = {
                // data from api
                // prevent error from hidden profile on realmeye
                status: checkProfileInfo && +realmeye?.ProfileInfo.Fame.split(' ')[0] > 0 ? '**aktif**' : 'quit'
            }
            return api_resultObj
        }
    })
    .catch(err => console.log(`realmeyeAPI error: ${err}`))
}

function fetcherManageRole(url, options) {
    return fetch(url, options)
    .then(data => { return data.status === 204 })
    .catch(err => console.log(`manageRoleAPI error: ${err}`))
}

function fetcherReminder(url, options) {
    return fetch(url, options)
    .then(data => { return data.text() })
    .then(htmlText => {
        const sholatNamesRegex = /Shubuh|Dzuhur|Ashr|Maghrib|Isya/g
        const sholatNamesAlt = ['subuh', 'siang', 'sore', 'magrib', 'isya']
        // sholat schedules
        const sholatObj = {
            names: htmlText.match(sholatNamesRegex).map((v, i) => { 
                    return v.replace(v, sholatNamesAlt[i]) 
                }),
            schedules: htmlText.match(/\d+\W\d+/g)
        }
        // other schedules
        sholatObj.names.push('pagi', 'pingsan')
        sholatObj.schedules.push('07:00', '22:00')
        return sholatObj
    })
    .catch(err => console.log(`reminderAPI error: ${err}`))
}

function fetcherWeather(url, options, type) {
    return fetch(url, options)
    .then(data => { return data.json() })
    .then(result => {
        // get result based on api type
        const { name, region } = result.location
        // 1-day weather report
        const newResult = type == 'forecast' ? result[type].forecastday[1] : result[type]
        const newDate = {
            date: newResult.last_updated?.split(' ')[0] || null,
            time: newResult.last_updated?.split(' ')[1] || null
        }
        // replace month number with string name
        const weatherDate = weatherMonthNames(newDate.date || newResult.date)
        // weather report payload
        const weatherObj = {
            city: name,
            region: region,
            date: weatherDate,
            time: newDate.time || null,
            temp: newResult?.temp_c ? `${newResult.temp_c} C` : `min:${newResult.day.mintemp_c} C | avg:${newResult.day.avgtemp_c} C | max:${newResult.day.maxtemp_c} C`,
            temp_feelslike: newResult?.feelslike_c ? `${newResult.feelslike_c} C` : null,
            condition: newResult.condition?.text || newResult.day.condition.text,
            precip: newResult?.precip_mm || newResult.day.totalprecip_mm,
            img: newResult.condition?.icon || newResult.day.condition.icon,
            humidity: newResult?.humidity ? `${newResult.humidity} %` : `${newResult.day.avghumidity} %`,
            rain_chance: newResult.day?.daily_chance_of_rain ? `${newResult.day.daily_chance_of_rain} %` : null
        }
        // per 2/3 hours weather report payload
        const newResultHours = type == 'forecast' ? result.forecast.forecastday[1] : result.forecast.forecastday[0]
        // weather report payload
        const weatherHoursArr = []
        // loop hour object
        const hour = newResultHours.hour
        const getSpecificHours = [6, 8, 10,
                                12, 13, 14,
                                15, 16, 17,
                                18, 20, 22]
        const firstHour = getSpecificHours[0].toString().length === 1 ? `0${getSpecificHours[0]}` : getSpecificHours[0]
        for(let i in hour) {
            // get hourly data as required
            if(getSpecificHours.indexOf(+i) !== -1) {
                const hourObj = {
                    city: name,
                    region: region,
                    date: weatherDate,
                    time: hour[i].time.split(' ')[1],
                    temp: `${hour[i].temp_c} C`,
                    temp_feelslike: `${hour[i].feelslike_c} C`,
                    condition: hour[i].condition.text,
                    img: weatherEmoji(hour[i].condition.text),
                    rain_chance: `${hour[i].chance_of_rain} %`
                }
                // push data to array
                weatherHoursArr.push(hourObj)
            }
        }
        return {perDay: weatherObj, perHour: weatherHoursArr, firstHour: firstHour}
    })
    .catch(err => console.log(`weatherAPI error: ${err}`))
}

module.exports = {
    fetcherRealmEye,
    fetcherManageRole,
    fetcherReminder,
    fetcherWeather
}