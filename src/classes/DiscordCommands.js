const { selectOne, queryBuilder, updateData } = require("../../database/databaseQueries")
const { resultHandler } = require("../replyHelper")

class DiscordCommands {
    constructor(interact) {
        this.interact = interact
    }

    async discord_link() {
        try {
            // get discord id
            const discordId = this.interact.user.id
            // discord_id != null, check is discord_id already used or not
            const query = queryBuilder('players', 1, 'discord_id', discordId)
            // get data
            const selectQuery = await selectOne(query)
            // discord_id found
            if(selectQuery.data.length !== 0 && selectQuery.data[0].discord_id !== null) {
                const replyContent = `your discord already linked to rotmg **${selectQuery.data[0].username}**` +
                                    "\nrun **/discord_unlink** to remove it"
                await this.interact.reply({ content: replyContent, ephemeral: true })
            }
            // discord_id not found
            else {
                const inputUsername = this.interact.options.get('username').value.toLowerCase()
                // find username
                const usernameQuery = queryBuilder('players', 12, 'username', inputUsername)
                const selectResult = await selectOne(usernameQuery)
                // check if the result is error / not found
                if(await resultHandler(this.interact, selectResult, inputUsername)) return
                // username found
                // check if the username already linked
                // if value is not null, must be string
                if(selectResult.data[0].discord_id !== null) {
                    // if value string, must have length
                    if(selectResult.data[0].discord_id.length !== 0) {
                        // string length isnt 0, dont overwrite the value
                        return await this.interact.reply({ 
                            content: 'this username already linked to another discord account', 
                            ephemeral: true 
                        })
                    }
                }
                // username doesnt linked to anything
                // update object
                const updateObj = { discord_id: this.interact.user.id }
                // update query
                const query = queryBuilder(
                    'players', 123, 'username', inputUsername,
                    { type: 'update', obj: updateObj }
                )
                // update player data
                const updateResult = await updateData(query)
                // reply message
                const discordUsername = this.interact.member.nickname || this.interact.user.username
                await this.interact.reply({ 
                    content: `RotMG **${updateResult.data[0].username}** linked to Discord **${discordUsername}**`, 
                    ephemeral: true 
                })
            }
        } catch (error) {
            console.log(error);
            await fetcherWebhook(this.interact.commandName, error)
        }
    }

    async discord_unlink() {
        try {
            // get discord id
            const discordId = this.interact.user.id
            // update object
            const updateObj = { discord_id: '' }
            // update query
            const query = queryBuilder(
                'players', 1, 'discord_id', discordId,
                { type: 'update', obj: updateObj }
            )
            // update data
            const updateQuery = await updateData(query)
            // check if the result is error / not found
            if(await resultHandler(this.interact, updateQuery, discordId)) return
            // reply after success update
            const replyContent = `your discord not linked to rotmg **${updateQuery.data[0].username}** anymore`
            await this.interact.reply({ content: replyContent, ephemeral: true })
        } catch (error) {
            console.log(error);
            await fetcherWebhook(this.interact.commandName, error)
        }
    }
}

module.exports = DiscordCommands