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

function fetcherWeather(url, options, areaData) {
    return fetch(url, options)
    .then(data => { return data.json() })
    .then(result => {
        const resultData = areaData === null ? result.data : result.data.areas[areaData.index]
        const weatherData = {
            province: resultData.domain,
            city: resultData.description,
            temperature: [], // params['5']
            weather: [] // params['6']
        }
        // insert date and other keys
        for(let i=0; i<3; i++) {
            weatherData.temperature.push({ date: null, other: [] })
            weatherData.weather.push({ date: null, other: [] })
        }
        // month string names
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        // get the temperature and weather data
        // 5 = temp, 6 = weather
        const params = [5, 6]
        let paramDate = 0
        let paramIndex = 0
        for(let param of params) {
            const paramData = resultData.params[param]
            for(let pDataTimes of paramData.times) {
                // split datetime to DATE and TIME
                // DATE
                const newDate = {
                    year: pDataTimes.datetime.slice(0, 8).slice(0, 4),
                    // parse to number for monthNames
                    month: +pDataTimes.datetime.slice(0, 8).slice(4, 6) - 1, 
                    date: pDataTimes.datetime.slice(0, 8).slice(-2)
                }
                // TIME
                // split then add : for readability
                const newTime = pDataTimes.datetime.slice(-4).split('')
                newTime.splice(2, 0, ':') 
                // fill the temperature and weather array
                switch(param) {
                    case 5:
                        if(paramDate % 4 === 3) {
                            // paramIndex on temperature = 0 1 2
                            weatherData.temperature[paramIndex % 3].date = `${newDate.date} ${monthNames[newDate.month]} ${newDate.year}`
                            weatherData.temperature[paramIndex % 3].other.push({ time: newTime.join(''), temp: pDataTimes.celcius })
                            // increment paramIndex to match the temperature[paramIndex].date indexes
                            paramIndex++
                        }
                        else 
                            weatherData.temperature[paramIndex % 3].other.push({ time: newTime.join(''), temp: pDataTimes.celcius })
                        break
                    case 6:
                        if(paramDate % 4 === 3) {
                            // use "paramIndex % 3" to prevent index error, because paramIndex will always increment
                            // paramIndex on weather = 3 4 5
                            weatherData.weather[paramIndex % 3].date = `${newDate.date} ${monthNames[newDate.month]} ${newDate.year}`
                            weatherData.weather[paramIndex % 3].other.push({ time: newTime.join(''), name: pDataTimes.name })
                            // increment paramIndex to match the weather[paramIndex].date indexes
                            paramIndex++
                        }
                        else 
                            weatherData.weather[paramIndex % 3].other.push({ time: newTime.join(''), name: pDataTimes.name })
                        break
                }
                // increment paramDate to prevent the same date
                paramDate++
            }
        }
        return weatherData
    })
    .catch(err => console.log(`weatherAPI error: ${err}`))
}

module.exports = {
    fetcherRealmEye,
    fetcherManageRole,
    fetcherReminder,
    fetcherWeather
}