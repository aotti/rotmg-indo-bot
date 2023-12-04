const { selectOne, insertDataRow, updateData, selectAll } = require('../database/databaseQueries')
const { EmbedBuilder } = require('discord.js')
const { pagination, ButtonTypes, ButtonStyles } = require('@devraelfreeze/discordjs-pagination');

function setReplyContent(type, data) {
    if(type === 'not found') {
        const contentBody = "~~                                               ~~\n" + 
        "**Player Not Found** :warning:\n" +
        "~~                                               ~~\n" + 
        "`username :` " + data.username + "\n" +
        "**note:** kalo memang ada player dgn username gituan, \nboleh bagi tau para founder biar ditambah ke list"
        return contentBody
    }
    else if(type === 'found') {
        const contentBody = "~~                                               ~~\n" + 
        "**Player Found** :white_check_mark:\n" +
        "~~                                               ~~\n" + 
        "`username :` " + data.username + "\n" +
        "`alias    :` " + data.alias + "\n" +
        "`region   :` " + data.region + "\n" +
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
        "`region   :` " + data.region + "\n" +
        "`status   :` " + data.status
        return contentBody
    }
}

function checkAdmin(userId) {
    return process.env.INDOG_FOUNDER.split('.').indexOf(userId)
}

function queryBuilder(table, selectColumn, whereColumn = null, whereValue = null, action = null) {
    const qb = {}
    // target table
    qb.table = table
    // select which columns wanna display 
    const choosenColumns = []
    // 1 = username, 2 = alias, 3 = region, 4 = status
    for(let col of selectColumn.toString().split('')) {
        switch(+col) {
            case 1: choosenColumns.push('username'); break
            case 2: choosenColumns.push('alias'); break
            case 3: choosenColumns.push('region'); break
            case 4: choosenColumns.push('status'); break
        }
    }
    qb.selectColumn = choosenColumns.join(', ')
    // the column used as the search area
    if(whereColumn) qb.whereColumn = whereColumn
    // the value used to search data in whereColumn
    if(whereValue) qb.whereValue = whereValue
    // action used to insert / update / delete a row (select query doesnt need action)
    if(action) {
        switch(action.type) {
            case 'insert':
                Object.defineProperties(qb, {
                    insertColumn: {
                        get: function () { return action.obj }, enumerable: true
                    }
                })
                break
            case 'update':
                Object.defineProperties(qb, {
                    updateColumn: {
                        get: function () { return action.obj }, enumerable: true
                    }
                })
                break
        }
    }
    // return object
    return qb
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
                    // get player input value
                    const inputUsername = interact.options.get('username').value.toLowerCase()
                    // start search in database
                    new Promise(resolve => {
                        // find player query
                        const query = queryBuilder('players', 1234, 'username', inputUsername)
                        resolve(selectOne(query))
                    })
                    .then(result => {
                        // check if the result is error / not found
                        if(resultHandler(interact, result, inputUsername)) return
                        // set reply message
                        const replyContent = setReplyContent('found', result.data[0])
                        // send reply message
                        interact.reply({ content: replyContent, ephemeral: true })
                    })
                    break
                case 'all_players':
                    // start get all player data
                    new Promise(resolve => {
                        const query = queryBuilder('players', 14)
                        resolve(selectAll(query))
                    })
                    .then(async result => {
                        // check if the result is error / not found
                        if(resultHandler(interact, result)) return
                        const playersObj = {}
                        const playersArr = []
                        // input all username to array
                        for(let i in result.data) {
                            playersArr.push(`${+i+1}. ${result.data[i].username} [${result.data[i].status}]`)
                        }
                        // slice materials
                        const sliceAmount = 5
                        let sliceStart = 0
                        let sliceEnd = 5
                        const sliceLoops = Math.ceil(playersArr.length / sliceAmount)
                        // slice array into few parts
                        for(let i=0; i<sliceLoops; i++) {
                            // slice the array
                            const slicedArray = playersArr.slice(sliceStart, sliceEnd)
                            // insert into object 
                            playersObj[`col_${i+1}`] = slicedArray
                            // update sliceStart and sliceEnd for different object page
                            sliceStart = sliceEnd
                            sliceEnd = sliceEnd + sliceAmount
                        }
                        // embed content materials
                        let embedCounter = 0
                        const embedPages = Math.ceil(playersArr.length / 15)
                        const embedFields = 3
                        const embedArray = []
                        // create embed (3x loops = 3 embeds)
                        for(let i=0; i<embedPages; i++) {
                            const embedContent = new EmbedBuilder()
                                .setTitle('Indog Player List')
                                .setDescription(`jumlah player: ${playersArr.length}`)
                            // create fields (2x loops = 2 pages)
                            // embedpages-1 to make 2 pages per embed
                            for(let j=0; j<embedFields; j++) {
                                const fieldValue = Object.values(playersObj)
                                embedContent.addFields({ 
                                    // set title every multiple of 2
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
                    })
                    break
                case 'insert':
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
                            region: interact.options.get('region')?.value.toLowerCase(),
                            status: interact.options.get('status')?.value.toLowerCase()
                        }
                        // start insert data
                        new Promise(resolve => {
                            // insert player query
                            const query = queryBuilder(
                                'players', 1234, null, null, 
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
                            status: interact.options.get('status')?.value.toLowerCase(),
                            new_username: interact.options.get('new_username')?.value.toLowerCase()
                        }
                        // start update data
                        new Promise(resolve => {
                            // update player query
                            const updateObj = {
                                username: inputs.new_username || inputs.username,
                                alias: inputs.alias,
                                region: inputs.region,
                                status: inputs.status
                            }
                            const query = queryBuilder(
                                'players', 1234, 'username', inputs.username,
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
            }
            break
    }
}

module.exports = {
    replyMessage
}