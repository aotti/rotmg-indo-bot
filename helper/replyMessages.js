const { selectOne, insertDataRow, updateData } = require('../database/databaseQueries')

function setReplyContent(type, data) {
    if(type === 'not found') {
        const contentBody = "~~                                               ~~\n" + 
        "**Player Not Found** :warning:\n" +
        "~~                                               ~~\n" + 
        "`username :` " + data.username + "\n" +
        "**note:** kalo memang ada player dgn username gituan, \nboleh bagi tau para admin biar ditambah ke list"
        return contentBody
    }
    else if(type === 'found') {
        const contentBody = "~~                                               ~~\n" + 
        "**Player Found** :white_check_mark:\n" +
        "~~                                               ~~\n" + 
        "`username :` " + data.username + "\n" +
        "`alias    :` " + data.alias + "\n" +
        "`region   :` " + data.region
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
}

function checkAdmin(userId) {
    return process.env.INDOG_FOUNDER.split('.').indexOf(userId)
}

function filterUpdateValues(obj) {
    const tempObj = {}
    for(let [key, value] of Object.entries(obj)) {
        if(value != null)
            tempObj[key] = value
    }
    return tempObj
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
                    // find player query
                    const query = {
                        table: 'players',
                        selectColumn: 'username, alias, region',
                        whereColumn: 'username',
                        whereValue: inputUsername
                    }
                    // start search in database
                    new Promise(resolve => {
                        resolve(selectOne(query))
                    })
                    .then(result => {
                        // if player not found
                        if(result.data.length === 0) {
                            // set reply message
                            const replyContent = setReplyContent('not found', {username: inputUsername})
                            return interact.reply({ content: replyContent, ephemeral: true })
                        }
                        // if error happen when doin queries
                        else if(result.error !== null) {
                            return interact.reply(JSON.stringify(result.error));
                        }
                        // set reply message
                        const replyContent = setReplyContent('found', result.data[0])
                        // send reply message
                        interact.reply({ content: replyContent, ephemeral: true })
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
                            region: interact.options.get('region')?.value.toLowerCase()
                        }
                        // insert player query
                        const query = {
                            table: 'players',
                            get insertColumn() {
                                return {
                                    username: inputs.username,
                                    alias: inputs.alias || null,
                                    region: inputs.region || null
                                }
                            }
                        }
                        // start insert data
                        new Promise(resolve => {
                            resolve(insertDataRow(query))
                        })
                        .then(result => {
                            // INSERT UNIQUE USERNAME ERROR HANDLING
                            if(result.error !== null) {
                                return interact.reply(JSON.stringify(result.error))
                            }
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
                            new_username: interact.options.get('new_username')?.value.toLowerCase()
                        }
                        // insert player query
                        const query = {
                            table: 'players',
                            whereColumn: 'username',
                            whereValue: inputs.username,
                            get updateColumn() {
                                return filterUpdateValues(inputs)
                            }
                        }
                        // start update data
                        new Promise(resolve => {
                            resolve(updateData(query))
                        })
                        .then(result => {
                            // UPDATE DATA ERROR HANDLING
                            if(result.error !== null) {
                                return interact.reply(JSON.stringify(result.error))
                            }
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