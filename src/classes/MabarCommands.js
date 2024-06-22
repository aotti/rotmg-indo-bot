const { EmbedBuilder } = require("discord.js")
const { queryBuilder, selectAll, insertDataRow, updateData } = require("../../database/databaseQueries")
const { replyPagination, filterObjectValues, setReplyContent, resultHandler, checkAdmin } = require("../replyHelper")

class MabarCommands {
    constructor(interact) {
        this.interact = interact
    }

    async mabar_check() {
        try {
            // get mabar query
            const inputStatus = this.interact.options.get('status').value.toLowerCase()
            const query = queryBuilder('schedules', 456789, 'status', inputStatus)
            // get all mabar schedules
            const selectQuery = await selectAll(query)
            // if table empty, stop
            if(selectQuery.data.length === 0) {
                return await this.interact.reply({ content: `There is no schedule`, ephemeral: true })
            }
            const scheduleObj = {}
            // split selectQuery.data materials
            // how many columns to make
            const sliceLoops = Math.ceil(selectQuery.data.length / 6)
            // slice per 6 indexes
            let sliceStart = 0
            let sliceEnd = 6
            // split selectQuery.data to 6 indexes per array
            for(let i=0; i<sliceLoops; i++) {
                // slice 6 array
                const slicedArray = selectQuery.data.slice(sliceStart, sliceEnd)
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
            const scheduleToday = new Date().toLocaleDateString('en-us', {month: 'long', day: 'numeric'})
            for(let i=0; i<embedPages; i++) {
                const checkScheduleStatus = scheduleObj['col_1'] 
                                            ? (scheduleObj['col_1'][0].status == 'pending' 
                                                ? 'List of pending mabar' 
                                                : 'List of completed mabar') + (`\n**Today:** ${scheduleToday}`)
                                            : null
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
                        status: null,
                        reminder_time: null
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
                        "\n`status :` " + fieldValue.status + ` (${fieldValue.reminder_time})`,
                        inline: true
                    })
                }
                // input embed to array
                embedArray.push(scheduleEmbed)
            }
            // send reply message with pagination
            await replyPagination(this.interact, embedArray)
        } catch (error) {
            console.log(error);
            await fetcherWebhook(JSON.stringify(error))
        }
    }

    async mabar_set() {
        try {
            // check if user is admin
            if(checkAdmin(this.interact.user.id) === -1) {
                // not admin
                return this.interact.reply({ content: 'Hanya **ADMIN** yang bisa menjalankan command ini.', ephemeral: true })
            }
            else {
                // get player input value
                const inputs = {
                    title: this.interact.options.get('title').value,
                    date: this.interact.options.get('date').value,
                    reminder_time: this.interact.options.get('reminder_time').value,
                    description: this.interact.options.get('description')?.value,
                    // default value 
                    status: 'pending'
                }
                // insert player query
                const query = queryBuilder(
                    'schedules', 456789, null, null, 
                    { type: 'insert', obj: filterObjectValues(inputs) }
                );
                // insert data
                const insertQuery = await insertDataRow(query)
                // check if the result is error / not found
                if(await resultHandler(this.interact, insertQuery)) return
                // send reply after success insert data
                const replyContent = setReplyContent('mabar', insertQuery.data[0])
                await this.interact.reply({ content: replyContent, ephemeral: true })
                await this.interact.followUp({ content: '*new mabar schedule added, run /mabar_check to see it* :eyes:' })
            }
        } catch (error) {
            console.log(error);
            await fetcherWebhook(JSON.stringify(error))
        }
    }

    async mabar_edit() {
        try {
            if(checkAdmin(this.interact.user.id) === -1) {
                // not admin
                return await this.interact.reply({ content: 'Hanya **ADMIN** yang bisa menjalankan command ini.', ephemeral: true })
            }
            else {
                // get input value
                const inputs = {
                    id: this.interact.options.get('id').value, // integer
                    title: this.interact.options.get('title')?.value, // string
                    date: this.interact.options.get('date')?.value, // date
                    reminder_time: this.interact.options.get('reminder_time')?.value, // string
                    status: this.interact.options.get('status')?.value.toLowerCase(), // string
                    description: this.interact.options.get('description')?.value // string
                }
                // query for update
                const query = queryBuilder(
                    'schedules', 45679, 'id', inputs.id,
                    { type: 'update', obj: filterObjectValues(inputs) }
                )
                // update data
                const updateQuery = await updateData(query)
                // check if the result is error / not found
                if(await resultHandler(this.interact, updateQuery, inputs.id)) return
                // reply after success update
                const replyContent = setReplyContent('edit_mabar', updateQuery.data[0])
                await this.interact.reply({ content: replyContent, ephemeral: true })
            }
        } catch (error) {
            console.log(error);
            await fetcherWebhook(JSON.stringify(error))
        }
    }
}

module.exports = MabarCommands