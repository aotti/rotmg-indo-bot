const { pagination, ButtonTypes, ButtonStyles } = require('@devraelfreeze/discordjs-pagination');

function setReplyContent(type, data) {
    if(type === 'not found') {
        const contentType = data.username || data.id
        const contentBody = "~~                                               ~~\n" + 
        `**${typeof contentType == 'string' ? 'Player' : 'Data'} Not Found** :warning:\n` +
        "~~                                               ~~\n" + 
        (typeof contentType == 'string' ? "`username :` " + contentType : "`id :` " + contentType )
        return contentBody
    }
    else if(type === 'found') {
        const contentBody = "~~                                               ~~\n" + 
        "**Player Found** :white_check_mark:\n" +
        "~~                                               ~~\n" + 
        "`username :` " + data.username + ` **(${data.discord_username || 'not linked'})**` + "\n" +
        "`alias    :` " + data.alias + "\n" +
        "`region   :` " + data.region + "\n" +
        "`rank     :` " + data.rank + "\n" +
        "`guild    :` " + data.guild + "\n" +
        "`created  :` " + data.created + "\n" +
        "`last seen:` " + data.lastSeen + "\n" +
        "`status   :` " + data.status
        return contentBody
    }
    else if(type === 'insert' || type === 'edit') {
        const contentTitle = type === 'insert' ? "**Player Added** :ok:\n" : "**Player Edited** :banana:\n"
        const contentBody = "~~                                               ~~\n" + 
        contentTitle +
        "~~                                               ~~\n" + 
        "`username :` " + data.username + "\n" +
        "`alias    :` " + data.alias + "\n" +
        "`region   :` " + data.region
        return contentBody
    }
    else if(type === 'mabar' || type === 'edit_mabar') {
        const contentTitle = type === 'mabar' ? "**Mabar Schedule Added** :ok:\n" : "**Mabar Schedule Edited** :banana:\n"
        const contentBody = "~~                                               ~~\n" + 
        contentTitle +
        "~~                                               ~~\n" + 
        "`title      :` " + data.title + "\n" +
        "`date(y-m-d):` " + data.date + "\n" +
        "`description:` " + data.description + "\n" +
        "`status     :` " + data.status + ` (${data.reminder_time})`
        return contentBody
    }
}

async function replyPagination(interact, embedArray) {
    await pagination({
        embeds: embedArray, /** Array of embeds objects */
        author: interact.member.user,
        interaction: interact,
        ephemeral: true,
        time: 400000, /** 400 seconds */
        disableButtons: false, /** Remove buttons after timeout */
        fastSkip: false,
        pageTravel: false,
        buttons: [
            {
                type: ButtonTypes.previous,
                label: 'Back',
                style: ButtonStyles.Primary
            },
            {
                type: ButtonTypes.next,
                label: 'Next',
                style: ButtonStyles.Success
            }
        ]
    })
}

function checkAdmin(userId) {
    return process.env.INDOG_FOUNDER.split('.').indexOf(userId)
}

function filterObjectValues(obj) {
    const tempObj = {}
    for(let [key, value] of Object.entries(obj)) {
        // if the object value not null, insert key & value to the object
        if(value != null)
            tempObj[key] = value
    }
    return tempObj
}

async function resultHandler(interact, result, userlookup = null) {
    try {
        // if result error
        if(result.data === null) {
            await interact.reply({ content: JSON.stringify(result.error), flags: '4096' })
            return true
        }
        // if result success but data not found
        else if(result.data.length === 0) {
            // set reply message
            const replyContent = setReplyContent('not found', {username: userlookup})
            await interact.reply({ content: replyContent, ephemeral: true })
            return true
        }
        // if data found, return false
        return false
    } catch (error) {
        console.log(error);
        await fetcherWebhook(`resultHandler-${this.interact.commandName}`, error)
    }
}

module.exports = {
    setReplyContent,
    replyPagination,
    checkAdmin,
    filterObjectValues,
    resultHandler
}