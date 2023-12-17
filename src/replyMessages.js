const { selectOne, insertDataRow, updateData, selectAll, queryBuilder } = require('../database/databaseQueries')
const { EmbedBuilder, GuildMemberRoleManager } = require('discord.js')
const { pagination, ButtonTypes, ButtonStyles } = require('@devraelfreeze/discordjs-pagination');
const { fetcherRealmEye, fetcherManageRole } = require('../helper/fetcher');

function setReplyContent(type, data) {
    if(type === 'not found') {
        const contentType = data.username || data.id
        const contentBody = "~~                                               ~~\n" + 
        `**${typeof contentType == 'string' ? 'Player' : 'Schedule'} Not Found** :warning:\n` +
        "~~                                               ~~\n" + 
        (typeof contentType == 'string' ? "`username :` " + contentType : "`id :` " + contentType )
        return contentBody
    }
    else if(type === 'found') {
        const contentBody = "~~                                               ~~\n" + 
        "**Player Found** :white_check_mark:\n" +
        "~~                                               ~~\n" + 
        "`username :` " + data.username + "\n" +
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
        "`status     :` " + data.status
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

function resultHandler(interact, result, userlookup = null) {
    // if result error
    if(result.error !== null) {
        interact.reply(JSON.stringify(result.error))
        return true
    }
    // if result success but data not found
    else if(result.data.length === 0) {
        // set reply message
        const replyContent = setReplyContent('not found', {username: userlookup})
        interact.reply({ content: replyContent, ephemeral: true })
        return true
    }
    // if data found, return false
    return false
}

function replyMessage(interact) {
    // reply to user who interacted with slash commands
    switch(interact.commandName) {
        case 'greetings':
            interact.reply('selamat subuh, bang')
            break
        // main command
        case 'indog':
            switch(interact.options.getSubcommand()) {
                // sub command
                case 'search':
                    console.log(interact.user.username, '> starting search command');
                    // get player input value
                    const inputUsername = interact.options.get('username').value.toLowerCase()
                    // start search in database
                    new Promise(resolve => {
                        // find player query
                        const query = queryBuilder('players', 123, 'username', inputUsername)
                        resolve(selectOne(query))
                    })
                    .then(async result => {
                        // check if the result is error / not found
                        if(resultHandler(interact, result, inputUsername)) return
                        // waiting reply 
                        interact.deferReply({ ephemeral: true })
                        // get realmeye api https://realmeye-api.glitch.me/player/[Player_Name]
                        const getRealmAPI = await fetcherRealmEye(`https://realmeye-api.glitch.me/player/${result.data[0].username}`)
                        // merge data from db AND realm api
                        const replyObj = {
                            // data from api
                            ...getRealmAPI,
                            // data from db
                            ...result.data[0]
                        }
                        // set reply content
                        const replyContent = setReplyContent('found', replyObj)
                        // send reply message
                        interact.followUp({ content: replyContent, ephemeral: true })
                    })
                    break
                case 'all_players':
                    console.log(interact.user.username, '> starting all_players command');
                    // start get all player data
                    new Promise(resolve => {
                        const query = queryBuilder('players', 1)
                        resolve(selectAll(query))
                    })
                    .then(async result => {
                        // check if the result is error / not found
                        if(resultHandler(interact, result)) return
                        // defer message until the fetch done
                        interact.deferReply({ ephemeral: true })
                        // players container
                        const playersObj = {}
                        const playersArr = []
                        // input all status & username to array
                        for(let i in result.data) {
                            // get realmeye api https://realmeye-api.glitch.me/player/[Player_Name]
                            const getRealmAPI = await fetcherRealmEye(`https://realmeye-api.glitch.me/player/${result.data[i].username}`, false)
                            playersArr.push(`${+i+1}. [${getRealmAPI.status}] ${result.data[i].username}`)
                        }
                        // get all active players
                        const activePlayers = playersArr.map(v => { return v.match('aktif') }).filter(i => i).length
                        // slice materials
                        // how many columns to make
                        const sliceLoops = Math.ceil(playersArr.length / 5) 
                        // slice per 5 indexes
                        let sliceStart = 0 
                        let sliceEnd = 5
                        // slice array into few parts
                        for(let i=0; i<sliceLoops; i++) {
                            // slice the array
                            const slicedArray = playersArr.slice(sliceStart, sliceEnd)
                            // insert into object 
                            playersObj[`col_${i+1}`] = slicedArray
                            // update sliceStart and sliceEnd for different object page
                            sliceStart = sliceEnd
                            sliceEnd = sliceEnd + 5
                        }
                        // embed content materials
                        let embedCounter = 0
                        // 15 = 3 fields per page
                        const embedPages = Math.ceil(playersArr.length / 15)
                        const embedFields = 3
                        const embedArray = []
                        // create embed (3x loops = 3 embeds)
                        for(let i=0; i<embedPages; i++) {
                            const embedContent = new EmbedBuilder()
                                .setTitle('Indog Player List')
                                .setDescription(`total: ${playersArr.length} | aktif: ${activePlayers}`)
                            // create fields (2x loops = 2 fields)
                            for(let j=0; j<embedFields; j++) {
                                const fieldValue = Object.values(playersObj)
                                embedContent.addFields({ 
                                    // set field title every multiple of embedFiels
                                    name: embedCounter % embedFields === 0 ? `Username [status]` : '** **', 
                                    value: fieldValue[embedCounter] != null ? fieldValue[embedCounter].join('\n') : '** **', 
                                    inline: true 
                                })
                                // increment for field titles
                                embedCounter++
                            }
                            // input each embed to array for pagination
                            embedArray.push(embedContent)
                        }
                        // send reply message with pagination
                        replyPagination(interact, embedArray)
                    })
                    break
                case 'insert':
                    console.log(interact.user.username, '> starting insert command');
                    // check if user is admin
                    if(checkAdmin(interact.user.id) === -1) {
                        // not admin
                        return interact.reply({ content: 'Hanya **Admin** yang boleh menjalankan command ini.', ephemeral: true })
                    }
                    // admin
                    else {
                        // get player input value
                        const inputs = {
                            username: interact.options.get('username').value.toLowerCase(),
                            alias: interact.options.get('alias')?.value.toLowerCase(),
                            region: interact.options.get('region')?.value.toLowerCase()
                        }
                        // start insert data
                        new Promise(resolve => {
                            // insert player query
                            const query = queryBuilder(
                                'players', 123, null, null, 
                                { type: 'insert', obj: filterObjectValues(inputs) }
                            );
                            resolve(insertDataRow(query))
                        })
                        .then(result => {
                            // check if the result is error / not found
                            if(resultHandler(interact, result)) return
                            // send reply after success insert data
                            const replyContent = setReplyContent('insert', result.data[0])
                            interact.reply({ content: replyContent, ephemeral: true })
                        })
                    }
                    break
                case 'edit':
                    console.log(interact.user.username, '> starting edit command');
                    // check if user is admin
                    if(checkAdmin(interact.user.id) === -1) {
                        // not admin
                        return interact.reply({ content: 'Hanya **Admin** yang boleh menjalankan command ini.', ephemeral: true })
                    }
                    else {
                        // get player input value
                        const inputs = {
                            username: interact.options.get('username').value.toLowerCase(),
                            alias: interact.options.get('alias')?.value.toLowerCase(),
                            region: interact.options.get('region')?.value.toLowerCase(),
                            new_username: interact.options.get('new_username')?.value.toLowerCase()
                        }
                        // start update data
                        new Promise(resolve => {
                            // update player query
                            const updateObj = {
                                username: inputs.new_username || inputs.username,
                                alias: inputs.alias,
                                region: inputs.region
                            }
                            const query = queryBuilder(
                                'players', 123, 'username', inputs.username,
                                { type: 'update', obj: filterObjectValues(updateObj) }
                            )
                            resolve(updateData(query))
                        })
                        .then(result => {
                            // check if the result is error / not found
                            if(resultHandler(interact, result, inputs.username)) return
                            // reply after success update
                            const replyContent = setReplyContent('edit', result.data[0])
                            interact.reply({ content: replyContent, ephemeral: true })
                        })
                    }
                    break
                case 'mabar_video':
                    console.log(interact.user.username, '> starting mabar_video command');
                    const videoLinks = {
                        mabar: {
                            oryx3: [
                                {
                                    discord: 'https://discord.com/channels/478542780243902464/601259330423226369/878535015686869013',
                                    youtube: 'https://youtu.be/YwFQH8QcuaQ'
                                },
                                {
                                    discord: 'https://discord.com/channels/478542780243902464/601259330423226369/887635892842418247',
                                    youtube: 'https://youtu.be/ytaRMIK43fQ'
                                }
                            ]
                        },
                        duo: {
                            oryx3: [
                                {
                                    discord: 'https://discord.com/channels/478542780243902464/601259330423226369/1163791431127814205',
                                    youtube: 'https://www.youtube.com/watch?v=HP_65nXeNzQ'
                                },
                                {
                                    discord: 'https://discord.com/channels/478542780243902464/601259330423226369/1166624066485108756',
                                    youtube: 'https://www.youtube.com/watch?v=nU6cZDFym3E'
                                }
                            ],
                            void: [
                                {
                                    discord: 'https://discord.com/channels/478542780243902464/601259330423226369/845845971538804746',
                                    youtube: 'https://www.youtube.com/watch?v=M1Yqi26obxo'
                                },
                                {
                                    youtube: 'https://www.youtube.com/watch?v=8CzKBn45w8g'
                                }
                            ]
                        }
                    }
                    // create embed
                    const videoEmbed = new EmbedBuilder()
                        .setTitle('Indog Mabar Recordings')
                        .addFields({ 
                            name: '\u2008', 
                            value: `__Mabar__
                            Oryx 3 ~ 𝟷𝚜𝚝 [youtube](${videoLinks.mabar.oryx3[0].youtube}) & [discord](${videoLinks.mabar.oryx3[0].discord})
                            Oryx 3 ~ 𝟸𝚗𝚍 [youtube](${videoLinks.mabar.oryx3[1].youtube}) & [discord](${videoLinks.mabar.oryx3[1].discord})`
                        })
                        .addFields({ 
                            name: '\u2008', 
                            value: `__Duo__
                            Oryx 3 ~ 𝟷𝚜𝚝 [youtube](${videoLinks.duo.oryx3[0].youtube}) & [discord](${videoLinks.duo.oryx3[0].discord})
                            Oryx 3 ~ 𝟸𝚗𝚍 [youtube](${videoLinks.duo.oryx3[1].youtube}) & [discord](${videoLinks.duo.oryx3[1].discord})
                            Void ~ 𝟷𝚜𝚝 [youtube](${videoLinks.duo.void[0].youtube}) & [discord](${videoLinks.duo.void[0].discord})
                            Void ~ 𝟸𝚗𝚍 [youtube](${videoLinks.duo.void[1].youtube})`
                        })
                    interact.reply({ embeds: [videoEmbed], ephemeral: true })
                    break
                case 'set_mabar':
                    console.log(interact.user.username, '> starting set_mabar command');
                    // check if user is admin
                    if(checkAdmin(interact.user.id) === -1) {
                        // not admin
                        return interact.reply({ content: 'Hanya **Admin** yang boleh menjalankan command ini.', ephemeral: true })
                    }
                    else {
                        // get player input value
                        const inputs = {
                            title: interact.options.get('title').value.toLowerCase(),
                            date: interact.options.get('date').value.toLowerCase(),
                            description: interact.options.get('description')?.value.toLowerCase(),
                            // default value 
                            status: 'pending'
                        }
                        new Promise(resolve => {
                            // insert player query
                            const query = queryBuilder(
                                'schedules', 4568, null, null, 
                                { type: 'insert', obj: filterObjectValues(inputs) }
                            );
                            resolve(insertDataRow(query))
                        })
                        .then(result => {
                            // check if the result is error / not found
                            if(resultHandler(interact, result)) return
                            // send reply after success insert data
                            const replyContent = setReplyContent('mabar', result.data[0])
                            interact.reply({ content: replyContent, ephemeral: true })
                        })
                    }
                    break
                case 'check_mabar':
                    console.log(interact.user.username, '> starting check_mabar command');
                    // start get all mabar schedules
                    new Promise(resolve => {
                        const inputStatus = interact.options.get('status').value.toLowerCase()
                        const query = queryBuilder('schedules', 45678, 'status', inputStatus)
                        resolve(selectAll(query))
                    })
                    .then(result => {
                        // if table empty, stop
                        if(result.data.length === 0) {
                            return interact.reply({ content: `There is no schedule`, ephemeral: true })
                        }
                        const scheduleObj = {}
                        // split result.data materials
                        // how many columns to make
                        const sliceLoops = Math.ceil(result.data.length / 6)
                        // slice per 6 indexes
                        let sliceStart = 0
                        let sliceEnd = 6
                        // split result.data to 6 indexes per array
                        for(let i=0; i<sliceLoops; i++) {
                            // slice 6 array
                            const slicedArray = result.data.slice(sliceStart, sliceEnd)
                            // insert sliced array to object
                            scheduleObj[`col_${i+1}`] = slicedArray
                            // update slice materials
                            sliceStart = sliceEnd
                            sliceEnd = sliceEnd + 6
                        }
                        // month string names
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                        // multiple embed materials
                        const embedPages = Object.keys(scheduleObj).length
                        const embedFields = 6
                        const embedArray = []
                        // create multiple embeds
                        for(let i=0; i<embedPages; i++) {
                            const checkScheduleStatus = scheduleObj['col_1'] ? 
                                                        scheduleObj['col_1'][0].status == 'pending' ?
                                                        'list of pending mabar' : 'list of completed mabar'
                                                        : 
                                                        null
                            // create embed
                            const scheduleEmbed = new EmbedBuilder()
                                .setTitle('Indog Mabar Schedules')
                                .setDescription(checkScheduleStatus)
                            for(let j=0; j<embedFields; j++) {
                                const fieldValue = Object.values(scheduleObj)[i][j] || 
                                // ### IF fieldValue ID NULL, MAKE DUMMY VALUES
                                {
                                    id: 9_999,
                                    title: 'empty slot :x:',
                                    date: '1999-1-1',
                                    description: null,
                                    status: null
                                }
                                // date.split('-')[1] = modified month number (date.getMonth() + 1) 
                                // it has to parse to integer then -1 
                                const monthName = monthNames[+fieldValue.date.split('-')[1] - 1]
                                // split the date
                                const newDate = fieldValue.date.split('-')
                                // replace the month number with month string
                                newDate.splice(1, 1, monthName)
                                // add field
                                scheduleEmbed.addFields({
                                    // no border on last 3 data (2nd row)
                                    name: (j > 2 ? `───────────────────\n${fieldValue.title}` : fieldValue.title) ,
                                    value: "`id     :` " + fieldValue.id +
                                    "\n`jadwal :` " + newDate.join('-') +
                                    "\n`ingfo  :` " + fieldValue.description +
                                    "\n`status :` " + fieldValue.status,
                                    inline: true
                                })
                            }
                            // input embed to array
                            embedArray.push(scheduleEmbed)
                        }
                        // send reply message with pagination
                        replyPagination(interact, embedArray)
                    })
                    break
                case 'edit_mabar':
                    console.log(interact.user.username, '> starting edit_mabar command');
                    if(checkAdmin(interact.user.id) === -1) {
                        // not admin
                        return interact.reply({ content: 'Hanya **Admin** yang boleh menjalankan command ini.', ephemeral: true })
                    }
                    else {
                        // get input value
                        const inputs = {
                            id: interact.options.get('id').value, // integer
                            title: interact.options.get('title')?.value.toLowerCase(), // string
                            date: interact.options.get('date')?.value, // date
                            status: interact.options.get('status')?.value.toLowerCase(), // string
                            description: interact.options.get('description')?.value.toLowerCase() // string
                        }
                        // start update data
                        new Promise(resolve => {
                            const query = queryBuilder(
                                'schedules', 4568, 'id', inputs.id,
                                { type: 'update', obj: filterObjectValues(inputs) }
                            )
                            resolve(updateData(query))
                        })
                        .then(result => {
                            // check if the result is error / not found
                            if(resultHandler(interact, result, inputs.id)) return
                            // reply after success update
                            const replyContent = setReplyContent('edit_mabar', result.data[0])
                            interact.reply({ content: replyContent, ephemeral: true })
                        })
                    }
                    break
                case 'wawan_ping':
                    console.log(interact.user.username, '> starting wawan_ping command');
                    const roleObj = {
                        guildId: '478542780243902464',
                        userId: interact.user.id,
                        roleId: '1185102820769280091'
                    }
                    // role endpoint
                    const roleEndpoint = `https://discord.com/api/v10/guilds/${roleObj.guildId}/members/${roleObj.userId}/roles/${roleObj.roleId}`
                    // check input value
                    const inputStatus = interact.options.get('status').value.toLowerCase()
                    if(inputStatus === 'on') {
                        const manageRoleObj = {
                            type: 'add',
                            fetchMethod: 'PUT',
                            checkMessage: 'You already have the role <:thonknoose:517990244600119297>',
                            successMessage: 'Role added :ok:',
                            failedMessage: 'Failed to add role :crying_cat_face:'
                        }
                        runManageRole(manageRoleObj)
                    }
                    else if(inputStatus === 'off') {
                        const manageRoleObj = {
                            type: 'delete',
                            fetchMethod: 'DELETE',
                            checkMessage: 'You dont have the role :skull:',
                            successMessage: 'Role deleted :fire:',
                            failedMessage: 'Failed to add role :crying_cat_face:'
                        }
                        runManageRole(manageRoleObj)
                    }
                    async function runManageRole(manageRoleObj) {
                        const { type, fetchMethod, checkMessage, successMessage, failedMessage } = manageRoleObj
                        // check role before add
                        const checkRole = await interact.guild.members.fetch(roleObj.userId)
                        // user already has the role
                        switch(true) {
                            // add role but already has it > checkRole = true
                            case type === 'add' && checkRole.roles.cache.has(roleObj.roleId):
                            // delete role but dont have it > checkRole = false === false
                            case type === 'delete' && (checkRole.roles.cache.has(roleObj.roleId) === false):
                                interact.reply({ content: checkMessage, ephemeral: true })
                                break
                            default:
                                // manage role fetch
                                const manageRoleFetch = await fetcherManageRole(roleEndpoint, fetchMethod)
                                // success manage role to user 
                                if(manageRoleFetch) 
                                    interact.reply({ content: successMessage, ephemeral: true })
                                // failed to manage role to user 
                                else 
                                    interact.reply({ content: failedMessage, ephemeral: true })
                        }
                    }
                    break
            }
            break
    }
}

module.exports = {
    replyMessage
}