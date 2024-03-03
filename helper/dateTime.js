// utc +7
function indonesiaDate() {
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
function convertTime12to24(time12h) {
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

function getNext3Weeks() {
    const dateIDN = indonesiaDate().localeKR.replace(/\W\s/g, '-').split('.')[0]
    const date = new Date(dateIDN)
    const dateObj = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        name: null
    }

    const next3weeks = []
    for(let i=0; i<21; i++) {
        // check month
        switch(dateObj.month) {
            // feb
            case 2:
                dateIncrement(dateObj, 29)
                break
            // april = 3; june = 5; sept = 8; nov = 10
            // 30 days per month
            case 4: case 6: case 9: case 11:
                dateIncrement(dateObj, 30)
                break
            // 31 days per month
            default:
                dateIncrement(dateObj, 31)
        }
        next3weeks.push({
            name: dateObj.name,
            value: `${dateObj.year}-${dateObj.month}-${dateObj.date}`
        })
    }
    return next3weeks
}

// increment date by 1 for the next 21 days (3 weeks)
function dateIncrement(tempDateObj, datesInOneMonth) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    // last date on calendar
    if(tempDateObj.date === datesInOneMonth) {
        tempDateObj.date = 1
        // last month on calendar
        if(tempDateObj.month === 12) {
            tempDateObj.month = 1
            tempDateObj.year = tempDateObj.year + 1
        }
        // not last month on calendar
        else {
            tempDateObj.month = tempDateObj.month + 1
        }
    }
    else {
        tempDateObj.date = tempDateObj.date + 1
    }
    // set date name
    tempDateObj.name = `${tempDateObj.date} ${monthNames[tempDateObj.month-1]} ${tempDateObj.year}`
    return tempDateObj
}

module.exports = {
    indonesiaDate,
    convertTime12to24,
    getNext3Weeks
}