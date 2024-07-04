const { EmbedBuilder } = require("discord.js")
const { queryBuilder, selectAll, selectOne, updateData, insertDataRow } = require("../../database/databaseQueries")
const { fetcherRealmEye, fetcherNotLocal, fetcherWebhook } = require("../../helper/fetcher")
const { resultHandler, replyPagination, setReplyContent, checkAdmin, filterObjectValues } = require("../replyHelper")

class PlayerCommands {
    constructor(interact) {
        this.interact = interact
    }

    async player_all() {
        try {
            const query = queryBuilder('players', 1)
            // get all player data
            const selectQuery = await selectAll(query)
            // check if the result is error / not found
            if(await resultHandler(this.interact, selectQuery)) return
            // defer message until the fetch done
            await this.interact.deferReply({ ephemeral: true })
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
                // get realmeye api https://realmeye-api.glitch.me/player/[Player_Name]
                const realmAPIEndpoint = `https://realmeye-api.glitch.me/player/${selectQuery.data[i].username}`
                const realmAPIResult = await fetcherRealmEye(realmAPIEndpoint, fetchOptions, false)
                playersArr.push(`${+i+1}. [${realmAPIResult.status}] ${selectQuery.data[i].username}`)
            }
            // get all active players
            const activePlayers = playersArr.map(v => { return v.match('aktif') }).filter(i => i).length
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
            // get player input value
            const inputUsername = this.interact.options.get('username').value.toLowerCase()
            // find player query
            const query = queryBuilder('players', 123, 'username', inputUsername)
            // get data
            const selectQuery = await selectOne(query)
            // check if the result is error / not found
            if(await resultHandler(this.interact, selectQuery, inputUsername)) return
            // waiting reply 
            const inputDisplay = this.interact.options.get('display')?.value
            if(inputDisplay == null) 
                await this.interact.deferReply({ flags: '4096' })
            else 
                await this.interact.deferReply({ ephemeral: true })
            // fetch options
            const fetchOptions = {
                method: 'GET',
                cache: "force-cache"
            }
            // get realmeye api https://realmeye-api.glitch.me/player/[Player_Name]
            const realmAPIEndpoint = `https://realmeye-api.glitch.me/player/${selectQuery.data[0].username}`
            const realmAPIResult = await fetcherRealmEye(realmAPIEndpoint, fetchOptions)
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
                    // remove username from db IF username from API is exist
                    if(realmAPIResult) delete selectQuery.data[0].username
                    // merge data from db AND realm api
                    const replyObj = {
                        // data from api
                        ...realmAPIResult,
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
            if(inputDisplay == null) 
                await this.interact.deferReply({ flags: '4096' })
            else 
                await this.interact.deferReply({ ephemeral: true })
            // graveyard module
            const scrape = require('graveyard-scrape').scrapeGraveyard
            const graveyards = await scrape(inputUsername, 6)
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
                const graveTitle = `${graveyards[i].class} (${graveDate}) ${i == 5 ? ':nerd:' : ''}`
                const graveDetails = `**stats:** ${graveyards[i].death_stats}
                                    **base:** ${graveyards[i].base_fame} Fame
                                    **total:** ${graveyards[i].total_fame} Fame
                                    **killed by:** ${graveyards[i].killed_by}`
                embedGraves.addFields({
                    name: (i > 2 ? '───────────────────\n' : '') + graveTitle, 
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

    async player_notlocal() {
        try {
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
            await this.interact.reply({ embeds: [notLocalEmbed], flags: '4096' })
        } catch (error) {
            console.log(error);
            await fetcherWebhook(this.interact.commandName, error)
        }
    }

    async player_insert() {
        try {
            // check if user is admin
            if(checkAdmin(this.interact.user.id) === -1) {
                // not admin
                return await this.interact.reply({ content: 'Hanya **ADMIN** yang bisa menjalankan command ini.', ephemeral: true })
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
                await this.interact.reply({ content: replyContent, ephemeral: true })
            }
        } catch (error) {
            console.log(error);
            await fetcherWebhook(this.interact.commandName, error)
        }
    }

    async player_edit() {
        try {
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
                await this.interact.reply({ content: replyContent, ephemeral: true })
            }
        } catch (error) {
            console.log(error);
            await fetcherWebhook(this.interact.commandName, error)
        }
    }
}

module.exports = PlayerCommands