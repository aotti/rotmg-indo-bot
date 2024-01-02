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
    // patchy = :last_quarter_moon:
    // light = :arrow_lower_right:
    // moderate = :left_right_arrow:
    // heavy, torrential = :arrow_upper_right:, :arrow_up:
    // at times, shower, freezing = :clock3:, :shower:, :cold_face:
    function getEmojis(regexArr, emojiArr) {
        for(let i in regexArr) {
            if(regexArr[i].test(condition)) 
                return emojiArr[i]
        }
    }
    // match the weather with emojis
    const weRegexes = [] // weather emoji regexes
    const weEmojis = []
    // rain with thunder
    if(condition.match(/with.thunder/i)) {
        weRegexes.push(/patchy|light/gi, /moderate.or.heavy/gi)
        weEmojis.push(
            ':thunder_cloud_rain: :arrow_lower_right: :last_quarter_moon:', 
            ':thunder_cloud_rain: :arrow_upper_right:'
        )
        return getEmojis(weRegexes, weEmojis)
    }
    // normal rain
    else if(condition.match(/rain|drizzle|sleet/i)) {
        weRegexes.push( 
            // shower
            /(?<=light.*)shower/gi, 
            /(?<=moderate.*)shower/gi, 
            /(?<=heavy|torrential.*)shower/gi,
            // patchy
            /patchy(?=light)/gi, 
            /patchy.(?=moderate)/gi, 
            /patchy.(?=freezing)/gi, 
            /patchy/gi, 
            // exact
            /light/gi,
            /moderate/gi,
            /heavy|torrential/gi
        )
        weEmojis.push(
            // shower
            ':cloud_rain: :arrow_lower_right: :shower:', 
            ':cloud_rain: :left_right_arrow: :shower:', 
            ':cloud_rain: :arrow_upper_right: :shower:',
            // patchy
            ':cloud_rain: :arrow_lower_right: :last_quarter_moon:', 
            ':cloud_rain: :left_right_arrow: :last_quarter_moon:', 
            ':cloud_rain: :cold_face: :last_quarter_moon:', 
            ':cloud_rain: :last_quarter_moon:', 
            // exact
            ':cloud_rain: :arrow_lower_right:',
            ':cloud_rain: :left_right_arrow:',
            ':cloud_rain: :arrow_upper_right:'
        )
        return getEmojis(weRegexes, weEmojis)
    }
    else if(condition.match(/fog|mist/i)) {
        return ':face_in_clouds:'
    }
    else if(condition.match(/cloudy/i)) {
        return ':white_sun_cloud:'
    }
    else if(condition.match(/overcast/i)) {
        return ':cloud:'
    }
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
            // check the text array length, if it has the same length as splitCondition
            // then join text array. if not, just use the english text
            const translatedCondition = conditionTextArr.length === splitCondition.length ?
                                    conditionTextArr.join(' ').charAt(0).toUpperCase() + conditionTextArr.join(' ').slice(1)
                                    :
                                    condition
            return translatedCondition
    }
}

function weatherPrecipitation(precip) {
    switch(true) {
        case precip > 0.5 && precip <= 20: return `${precip} mm (ringan)`
        case precip > 20 && precip <= 50: return `${precip} mm (sedang)`
        case precip > 50 && precip <= 100: return `${precip} mm (lebat)`
        case precip > 100 && precip <= 150: return `${precip} mm (lebat binggo)`
        case precip > 150: return `${precip} mm (mungkin banjir)`
        default: return `${precip} mm (santuy :sunglasses:)`
    }
}

module.exports = {
    weatherCityList,
    weatherMonthNames,
    weatherFieldName,
    weatherEmoji,
    weatherConditionTranslate,
    weatherPrecipitation
}