function weatherCityList() {
    return [
        { 
            name: 'Arga Makmur', 
            value: '-3.443, 102.178' 
        },
        { 
            name: 'Bandung', 
            value: '-6.917, 107.617' 
        },
        { 
            name: 'Bandar Lampung', 
            value: '-5.364, 105.265' 
        },
        { 
            name: 'Bekasi', 
            value: '-6.239, 106.978' 
        },
        { 
            name: 'Ciamis', 
            value: '-7.330, 108.333' 
        },
        { 
            name: 'Jakarta Raya', 
            value: '-6.174, 106.828' 
        },
        { 
            name: 'Malang', 
            value: '-7.967, 112.6307' 
        },
        { 
            name: 'Medan', 
            value: '3.5953 98.6894' 
        },
        { 
            name: 'Padang', 
            value: '-0.88, 100.3905' 
        },
        { 
            name: 'Semarang', 
            value: '-7.007, 110.4404' 
        },
        { 
            name: 'Solo (Surakarta)', 
            value: '-7.5594, 110.8225' 
        },
        { 
            name: 'Tangerang', 
            value: '-6.167, 106.643' 
        },
        { 
            name: 'Tangerang Selatan', 
            value: '-6.282, 106.714' 
        },
        { 
            name: 'Yogyakarta', 
            value: '-7.795, 110.3731' 
        }
    ]
}

function weatherMonthNames(date) {
    // month string names
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return date?.replace(`-${date.split('-')[1]}-`, ` ${monthNames[+date.split('-')[1] - 1]} `)
}

function weatherFieldName(i, date, time, img, firstHour) {
    if(time.match(firstHour)) {
        if(date.match(new Date().getDate())) {
            return `${date} (today)\n${time}  ${img}`
        }
        else {
            return `${date} (tomorrow)\n${time}  ${img}`
        }
    }
    else {
        if(i < 3)
            return `** **\n${time}  ${img}`
        else 
            return `${time}  ${img}`
    }
}

function weatherEmoji(condition) {
    if(condition.match(/with.thunder/i))
        return ':thunder_cloud_rain:'
    else if(condition.match(/rain|drizzle/i)) 
        return ':cloud_rain:'
    else if(condition.match(/fog|mist/i))
        return ':face_in_clouds:'
    else if(condition.match(/cloudy/i))
        return ':white_sun_cloud:'
    else if(condition.match(/overcast/i))
        return ':cloud:'
    else 
        return ':partly_sunny:'
}

function weatherConditionTranslate(condition) {
    switch(condition) {
        // translate only 1 word
        case 'Sunny': 
            return 'Cerah'
        case 'Clear': 
            return 'Jelas'
        case 'Cloudy': case 'Partly cloudy': 
            return 'Berawan'
        case 'Overcast': 
            return 'Mendung'
        case 'Mist': case 'Fog': 
            return 'Berkabut'
        // translate more than 1 word
        default:
            // patchy, light, moderate, heavy, torrential
            // freezing
            // rain, drizzle, sleet
            // at times, with thunder, shower
            const conditionTextArr = []
            const splitCondition = condition.split(' ')
            for(let text of splitCondition) {
                // patchy, light, moderate, heavy, torrential
                if(text.match(/patchy|light|moderate|heavy|torrential/i)) {
                    switch(text.toLowerCase()) {
                        case 'patchy': conditionTextArr.push('tidak merata'); break
                        case 'light': conditionTextArr.push('ringan'); break
                        case 'moderate': conditionTextArr.push('sedang'); break
                        case 'heavy': conditionTextArr.push('lebat'); break
                        case 'torrential': conditionTextArr.push('lebat (menusuk)'); break
                    }
                }
                // freezing, or, possible
                else if(text.match(/freezing|or|possible/)) {
                    switch(text.toLowerCase()) {
                        case 'freezing': conditionTextArr.push('dingin'); break
                        case 'or': conditionTextArr.push('atau'); break
                        case 'possible': conditionTextArr.push('(kemungkinan)'); break
                    }
                }
                // rain, drizzle, sleet
                else if(text.match(/rain|drizzle|sleet/i)) {
                    switch(text.toLowerCase()) {
                        case 'rain': conditionTextArr.unshift('hujan'); break
                        case 'drizzle': conditionTextArr.unshift('gerimis'); break
                        case 'sleet': conditionTextArr.unshift('hujan es'); break
                    }
                }
                // at times, with thunder, shower
                else if(text.match(/at.times|with.thunder|shower/i)) {
                    switch(text.toLowerCase()) {
                        case 'at times': conditionTextArr.push('terkadang'); break
                        case 'with thunder': conditionTextArr.push('dengan petir'); break
                        case 'shower': case 'showers':
                            conditionTextArr.push('(sebentar)'); break
                    }
                }
            }
            // parse array to string then uppercase first letter
            const translatedCondition = conditionTextArr.join(' ').charAt(0).toUpperCase() + conditionTextArr.join(' ').slice(1)
            return translatedCondition
    }
}

module.exports = {
    weatherCityList,
    weatherMonthNames,
    weatherFieldName,
    weatherEmoji,
    weatherConditionTranslate
}