const { EmbedBuilder, MessageFlags } = require("discord.js")
const { queryBuilder, selectAll, selectOne, updateData, insertDataRow, callFunction } = require("../../database/databaseQueries")
const { fetcherRealmEye, fetcherNotLocal, fetcherWebhook, fetchGraveyards } = require("../../helper/fetcher")
const { resultHandler, replyPagination, setReplyContent, checkAdmin, filterObjectValues } = require("../replyHelper")
const cheerio = require('cheerio');

class PlayerCommands {
    constructor(interact) {
        this.interact = interact
    }

    async player_sync() {
        try {
            // defer message until the fetch done
            await this.interact.deferReply({ flags: MessageFlags.Ephemeral })
            // check if user is admin
            if(checkAdmin(this.interact.user.id) === -1) {
                // not admin
                return await this.interact.editReply({ content: 'Hanya **ADMIN** yang bisa menjalankan command ini.', flags: MessageFlags.Ephemeral })
            }
            else {
                // get inputs 
                const inputs = {
                    start: +this.interact.options.get('start')?.value,
                    end: +this.interact.options.get('end')?.value
                }
                // check start + end gap
                const startEndGap = inputs.end - inputs.start
                if(startEndGap > 20) {
                    return await this.interact.editReply({ content: `maksimal 20 data (si donggo ${startEndGap})`, flags: MessageFlags.Ephemeral })
                }
                // get all player data
                const query = queryBuilder('players', 1)
                const selectQuery = await selectAll(query)
                // check if the result is error / not found
                if(await resultHandler(this.interact, selectQuery)) return
                
                // slice output with start + end inputs
                const playerSlicedArray = selectQuery.data.slice(inputs.start, inputs.end)
                const playerUpdateList = playerSlicedArray.map(v => v.username)
                const playerUpdateListText = () => {
                    // only modify if update player > 10
                    if(playerUpdateList.length > 10) {
                        const [puList_1, puList_2] = [playerUpdateList.slice(0, 10), playerUpdateList.slice(10)]
                        const tempPlayerUpdateList = []
                        for(let i=0; i<10; i++) {
                            puList_2[i] 
                                ? tempPlayerUpdateList.push(`${puList_1[i]}..........${puList_2[i]}`)
                                : tempPlayerUpdateList.push(`${puList_1[i]}..........`)
                        } 
                        return tempPlayerUpdateList.join('\n')
                    }
                    // update player <= 10
                    return playerUpdateList.join('\n')
                }
                // show players who will get update
                await this.interact.editReply({ content: `**player yang akan mendapat update:**\n${playerUpdateListText()}`, flags: MessageFlags.Ephemeral })
                
                // get player data from webscraping
                const playerContainer = []
                for(let player of playerSlicedArray) {
                    const playerObject = {
                        username: player.username,
                        status: null,
                        rank: null,
                        guild: null,
                        first_seen: null,
                        last_seen: null,
                    }
                    // const playerData = await cheerio.fromURL(`https://www.realmeye.com/player/${player.username}`)
                    const playerData = await (await fetch(`https://www.realmeye.com/player/${player.username}`)).text()
                    const playerHTMLData = cheerio.load(playerData)
                    const getHTMLData = ($) => {
                        const tempPlayerObject = []
                        // get player info table
                        const playerInfo = $('.summary')[0]
                        if(!playerInfo) {
                            playerObject.status = 'quit'
                            return playerObject
                        }
                        // loop table row
                        const tableRows = playerInfo.children[0].children
                        for(let i=0; i<tableRows.length; i++) {
                            // loop table cell
                            const tableCols = tableRows[i].children
                            for(let cell of tableCols) {
                                // get player info
                                const element = cell.children
                                const textContent = cell.children[0]?.data
                                if(textContent)
                                    tempPlayerObject.push(textContent)
                                else if(element[0].children[0].data)
                                    tempPlayerObject.push(element[0].children[0].data)
                                else if(element[1]?.data)
                                    tempPlayerObject.push(element[1]?.data.trim())
                            }
                        }
                        // return player data
                        return tempPlayerObject
                    }

                    const tempPlayerObject = getHTMLData(playerHTMLData)
                    // group temp player object to array 2 element each
                    const groupTempPlayerObject = []
                    for(let i=0; i<tempPlayerObject.length; i+=2) {
                        groupTempPlayerObject.push([tempPlayerObject[i], tempPlayerObject[i+1]])
                    }
                    // parse player html data then move to player object
                    for(let playerData of groupTempPlayerObject) {
                        switch(playerData[0]) {
                            case 'Characters': 
                                playerObject.status = +playerData[1] > 0 ? 'aktif' : 'quit'
                                break
                            case 'Rank':
                                playerObject.rank = playerData[1] ? playerData[1] : 'null'
                                break
                            case 'Guild': 
                                playerObject.guild = playerData[1] ? playerData[1] : 'null'
                                break
                            case 'Created': 
                            case 'First seen': 
                                playerObject.first_seen = playerData[1] ? playerData[1] : 'null'
                                break
                            case 'Last seen': 
                                playerObject.last_seen = playerData[1] ? playerData[1] : 'null'
                                break
                        }
                    }
                    playerContainer.push(playerObject)
                }
                
                // modify player container data
                const playerUsernames = playerContainer.map(v => v.username).join(';')
                const playerStatuses = playerContainer.map(v => v.status).join(';')
                const playerRanks = playerContainer.map(v => v.rank).join(';')
                const playerGuilds = playerContainer.map(v => v.guild).join(';')
                const playerFirstSeens = playerContainer.map(v => v.first_seen).join(';')
                const playerLastSeens = playerContainer.map(v => v.last_seen).join(';')
                // update player data di database
                const updateObj = {
                    function_name: 'rotmg_update_players',
                    function_params: {
                        tmp_username: playerUsernames,
                        tmp_status: playerStatuses,
                        tmp_rank: playerRanks,
                        tmp_guild: playerGuilds,
                        tmp_first_seen: playerFirstSeens,
                        tmp_last_seen: playerLastSeens,
                        tmp_amount: playerUpdateList.length,
                    }
                }
                const updateQuery = await callFunction(updateObj)
                // check if the result is error / not found
                if(await resultHandler(this.interact, updateQuery)) return
                // set success response
                return await this.interact.followUp({ content: `${startEndGap} data player berhasil di update`, flags: MessageFlags.Ephemeral })
            }
            // defer reply
        } catch (error) {
            console.log(error);
            await fetcherWebhook(this.interact.commandName, error)
        }
    }

    async player_all() {
        try {
            // defer message until the fetch done
            await this.interact.deferReply({ ephemeral: true })
    
            const query = queryBuilder('players', 129)
            // get all player data
            const selectQuery = await selectAll(query)
            // check if the result is error / not found
            if(await resultHandler(this.interact, selectQuery)) return
            // players container
            const playersObj = {}
            const playersArr = []
            // fetch options
            const fetchOptions = {
                method: 'GET',
                cache: "force-cache"
            }
            // input all status & username to array
            for(let i in selectQuery.data) {
                const activeStatus = selectQuery.data[i].status == 'aktif' 
                                    ? `**${selectQuery.data[i].status}**` 
                                    : selectQuery.data[i].status
                playersArr.push(`${+i+1}. [${activeStatus}] ${selectQuery.data[i].username}`)
            }
            // get all active players
            const activePlayers = selectQuery.data.map(v => v.status == 'aktif' ? v : null).filter(i => i).length
            // get all linked players
            const linkedPlayers = selectQuery.data.map(v => v.discord_id && v.discord_id.length > 0).filter(i => i).length
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
                    .setDescription(`total: ${playersArr.length} | aktif: ${activePlayers} | linked: ${linkedPlayers}`)
                // create fields (2x loops = 2 fields)
                for(let j=0; j<embedFields; j++) {
                    const fieldValue = Object.values(playersObj)
                    embedContent.addFields({ 
                        // set field title every multiple of embedFiels
                        // note: '** **' equal to null
                        name: embedCounter % embedFields === 0 ? `[status] Username` : '** **', 
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
            await replyPagination(this.interact, embedArray)
        } catch (error) {
            console.log(error);
            await fetcherWebhook(this.interact.commandName, error)
        }
    }

    async player_search() {
        try {
            // waiting reply 
            const inputDisplay = this.interact.options.get('display')?.value
            if(inputDisplay == null) await this.interact.deferReply({ flags: '4096' })
            else await this.interact.deferReply({ ephemeral: true })
    
            // get player input value
            const inputUsername = this.interact.options.get('username').value.toLowerCase()
            // find player query
            const query = queryBuilder('players', 1239, 'username', inputUsername)
            // get data
            const selectQuery = await selectOne(query)
            // check if the result is error / not found
            if(await resultHandler(this.interact, selectQuery, inputUsername)) return
            
            // get discord members
            const guildMembers = await this.interact.guild.members.list({ limit: 100 })
            for(let member of guildMembers) {
                // get anjay mabar role
                const getRole = member[1].roles.cache.get('496164930605547520')
                // find member with anjay mabar
                if(getRole != null) {
                    const members = getRole.members.map(v => {
                        // filter member with BOT role
                        if(!v.roles.cache.get('587622073266995221')) {
                            const discordUsername = v.nickname || v.displayName
                            return { 
                                discord_id: v.id, 
                                discord_username: discordUsername 
                            }
                        }
                    }).filter(i => i)
                    // get discord username for selected player
                    const selectedMember = members.map(v => { 
                        if(v.discord_id === selectQuery.data[0].discord_id) 
                            return v
                    }).filter(i => i)[0]
                    // merge data from db AND realm api
                    const replyObj = {
                        // data from db
                        ...selectQuery.data[0],
                        // data from discord username
                        ...selectedMember
                    }
                    // set reply content
                    const replyContent = setReplyContent('found', replyObj)
                    // send reply message
                    await this.interact.followUp({ content: replyContent })
                    break
                }
            }
        } catch (error) {
            console.log(error);
            await fetcherWebhook(this.interact.commandName, error)
        }
    }

    async player_deaths() {
        try {
            // get inputs
            const inputUsername = this.interact.options.get('username').value.toLowerCase()
            const inputDisplay = this.interact.options.get('display')?.value
            // defer reply
            if(inputDisplay == null) await this.interact.deferReply({ flags: '4096' })
            else await this.interact.deferReply({ flags: '64' })
    
            // get graveyard data
            const graveyardUrl = `https://www.realmeye.com/graveyard-of-player/${inputUsername}`
            const graveyards = await fetchGraveyards(graveyardUrl, null)
            if(graveyards.length === 0) {
                // reply interact
                return await this.interact.followUp({ content: `player **${inputUsername}** could be private / doesnt exist :skull:` })
            }
            // create embed
            const embedGraves = new EmbedBuilder()
                .setTitle(`${inputUsername} graveyard`)
                .setDescription(':nerd: - latest death\n───────────────────')
            // add fields
            for(let i in graveyards) {
                const graveDate = new Date(graveyards[i].death_date).toLocaleDateString('id')
                const graveClass = `${graveyards[i].class} (${graveDate}) ${i == 0 ? ':nerd:' : ''}`
                const graveDetails = `**stats:** ${graveyards[i].death_stats}
                                    **base:** ${graveyards[i].base_fame} Fame
                                    **total:** ${graveyards[i].total_fame} Fame
                                    **killed by:** ${graveyards[i].killed_by}`
                embedGraves.addFields({
                    name: (i > 2 ? '───────────────────\n' : '') + graveClass, 
                    value: graveDetails, 
                    inline: true
                })
            }
            // reply interact
            await this.interact.followUp({ embeds: [embedGraves] })
        } catch (error) {
            console.log(error);
            await fetcherWebhook(this.interact.commandName, error)
        }
    }

    async player_death_alarm() {
        try {
            // defer message until the fetch done
            await this.interact.deferReply({ ephemeral: true })
            // check input value
            const inputStatus = this.interact.options.get('status').value.toLowerCase()
            const inputUsername = this.interact.options.get('username').value.toLowerCase()
            // alarm on
            if(inputStatus == 'on') {
                // get player graveyard
                const scrape = require('graveyard-scrape').scrapeGraveyard
                // is graveyard public
                const isGraveyardPublic = await scrape(inputUsername, 1)
                if(isGraveyardPublic.length === 0 || new Date(isGraveyardPublic[0].death_date).toString() == 'Invalid Date') {
                    return await this.interact.editReply({ content: `${inputUsername} graveyard is private :skull:`, ephemeral: true })
                }
                // update player query
                const updateObj = {
                    death: true
                }
                const query = queryBuilder(
                    'players', 123, 'username', inputUsername,
                    { type: 'update', obj: filterObjectValues(updateObj) }
                )
                // update data
                const updateQuery = await updateData(query)
                // check if the result is error / not found
                if(await resultHandler(this.interact, updateQuery, inputUsername)) return
                // reply after success update
                const replyContent = "**death alarm is now ON**" +
                                    "\nif your graveyard not showing, probably cuz realmeye not updating yet :nerd:" +
                                    "\nto update the graveyard on realmeye, you can try create new character" +
                                    "\nto replace the empty slot (worth a try :sunglasses:)"
                await this.interact.editReply({ content: replyContent, ephemeral: true })
            }
            // alarm off
            else if(inputStatus == 'off') {
                // update player query
                const updateObj = {
                    death: false
                }
                const query = queryBuilder(
                    'players', 123, 'username', inputUsername,
                    { type: 'update', obj: filterObjectValues(updateObj) }
                )
                // update data
                const updateQuery = await updateData(query)
                // check if the result is error / not found
                if(await resultHandler(this.interact, updateQuery, inputUsername)) return
                // reply after success update
                const replyContent = "**death alarm is now OFF** :skull:"
                await this.interact.editReply({ content: replyContent, ephemeral: true })
            }
        } catch (error) {
            console.log(error);
            await fetcherWebhook(this.interact.commandName, error)
        }
    }

    async player_notlocal() {
        try {
            // defer message until the fetch done
            await this.interact.deferReply({ flags: '4096' })

            const afterQuery = 'after=1227861247068864602'
            const limitQuery = 'limit=10'
            const getMessagesURL = `https://discord.com/api/v10/channels/${process.env.NOT_LOCAL_CHANNEL}/messages?${afterQuery}&${limitQuery}`
            const fetchOptions = {
                method: 'GET',
                headers: {
                    Authorization: `Bot ${process.env.TOKEN}`
                }
            }
            const getNotLocalMessages = await fetcherNotLocal(getMessagesURL, fetchOptions)
            // filter messages content length
            const filteredNotLocalMessages = []
            for(let message of getNotLocalMessages) {
                // skip admins
                if(checkAdmin(message.author.id) !== -1) continue
                // not local users
                if(message.content.length <= 15) {
                    const notLocalPlayer = {
                        discord_id: message.author.id,
                        discord_username: null,
                        rotmg_username: message.content 
                    }
                    filteredNotLocalMessages.push(notLocalPlayer)
                }
            }
            // get discord members
            const guildMembers = await this.interact.guild.members.list({ limit: 100 })
            for(let member of guildMembers) {
                const matchMemberWithNotLocal = filteredNotLocalMessages.map(v => v.discord_id).indexOf(member[1].user.id)
                if(matchMemberWithNotLocal !== -1) {
                    const index = matchMemberWithNotLocal
                    filteredNotLocalMessages[index].discord_username = member[1].nickname || member[1].displayName
                } 
            }
            // create embed
            const notLocalDescription = `rotmg username is based on user input 
                                        if it doesnt match in-game, he must be a ballsac
                                        ───────────────────
                                        ~ **rotmg username**
                                        ~ discord username`
            const notLocalEmbed = new EmbedBuilder()
                .setTitle('Not Local Players')
                .setDescription(notLocalDescription)
            // add fields
            for(let msg of filteredNotLocalMessages) {
                notLocalEmbed.addFields({
                    name: msg.rotmg_username,
                    value: msg.discord_username,
                    inline: true
                })
            }
            // reply message
            await this.interact.editReply({ embeds: [notLocalEmbed] })
        } catch (error) {
            console.log(error);
            await fetcherWebhook(this.interact.commandName, error)
        }
    }

    async player_insert() {
        try {
            // defer message until the fetch done
            await this.interact.deferReply({ ephemeral: true })

            // check if user is admin
            if(checkAdmin(this.interact.user.id) === -1) {
                // not admin
                return await this.interact.editReply({ content: 'Hanya **ADMIN** yang bisa menjalankan command ini.', ephemeral: true })
            }
            // admin
            else {
                // get player input value
                const inputs = {
                    username: this.interact.options.get('username').value.toLowerCase(),
                    alias: this.interact.options.get('alias')?.value.toLowerCase(),
                    region: this.interact.options.get('region')?.value.toLowerCase()
                }
                // insert player query
                const query = queryBuilder(
                    'players', 123, null, null, 
                    { type: 'insert', obj: filterObjectValues(inputs) }
                );
                // insert data
                const insertQuery = await insertDataRow(query)
                // check if the result is error / not found
                if(await resultHandler(this.interact, insertQuery)) return
                // send reply after success insert data
                const replyContent = setReplyContent('insert', insertQuery.data[0])
                await this.interact.editReply({ content: replyContent })
            }
        } catch (error) {
            console.log(error);
            await fetcherWebhook(this.interact.commandName, error)
        }
    }

    async player_edit() {
        try {
            // defer message until the fetch done
            await this.interact.deferReply({ ephemeral: true })
    
            // check if user is admin
            if(checkAdmin(this.interact.user.id) === -1) {
                // not admin
                return await this.interact.reply({ content: 'Hanya **ADMIN** yang bisa menjalankan command ini.', ephemeral: true })
            }
            else {
                // get player input value
                const inputs = {
                    username: this.interact.options.get('username').value.toLowerCase(),
                    alias: this.interact.options.get('alias')?.value.toLowerCase(),
                    region: this.interact.options.get('region')?.value.toLowerCase(),
                    new_username: this.interact.options.get('new_username')?.value.toLowerCase()
                }
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
                // update data
                const updateQuery = await updateData(query)
                // check if the result is error / not found
                if(await resultHandler(this.interact, updateQuery, inputs.username)) return
                // reply after success update
                const replyContent = setReplyContent('edit', updateQuery.data[0])
                await this.interact.editReply({ content: replyContent, ephemeral: true })
            }
        } catch (error) {
            console.log(error);
            await fetcherWebhook(this.interact.commandName, error)
        }
    }
}

module.exports = PlayerCommands