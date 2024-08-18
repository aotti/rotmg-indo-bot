const { EmbedBuilder } = require("discord.js")
const { fetcherManageRole, fetcherWeather, fetcherWebhook } = require("../../helper/fetcher")
const { weatherFieldName, weatherConditionTranslate, weatherPrecipitation } = require("../../helper/weatherChoices")
const { replyPagination } = require("../replyHelper")

class MiscCommands {
    constructor(interact) {
        this.interact = interact
    }

    wawan_ping() {
        // data for adding role
        const roleObj = {
            guildId: '478542780243902464',
            userId: this.interact.user.id,
            roleId: '1185102820769280091'
        }
        // check input value
        const inputStatus = this.interact.options.get('status').value.toLowerCase()
        // add role
        if(inputStatus === 'on') {
            const manageRoleObj = {
                type: 'add',
                fetchMethod: 'PUT',
                checkMessage: 'You already have the role <:thonknoose:517990244600119297>',
                successMessage: 'Role added :ok:',
                failedMessage: 'Failed to add role :crying_cat_face:'
            }
            runManageRole(this.interact, manageRoleObj)
        }
        // remove role
        else if(inputStatus === 'off') {
            const manageRoleObj = {
                type: 'delete',
                fetchMethod: 'DELETE',
                checkMessage: 'You dont have the role :skull:',
                successMessage: 'Role deleted :fire:',
                failedMessage: 'Failed to add role :crying_cat_face:'
            }
            runManageRole(this.interact, manageRoleObj)
        }
        // manage role
        async function runManageRole(interact, manageRoleObj) {
            try {
                // defer message until the fetch done
                await interact.deferReply({ ephemeral: true })
    
                const { type, fetchMethod, checkMessage, successMessage, failedMessage } = manageRoleObj
                // role endpoint
                const roleEndpoint = `https://discord.com/api/v10/guilds/${roleObj.guildId}/members/${roleObj.userId}/roles/${roleObj.roleId}`
                // check role before add
                const checkRole = await interact.guild.members.fetch(roleObj.userId)
                // user already has the role
                switch(true) {
                    // add role > but already has it, checkRole = true
                    case type === 'add' && checkRole.roles.cache.has(roleObj.roleId):
                    // delete role > but dont have it, checkRole = false === false (true)
                    case type === 'delete' && (checkRole.roles.cache.has(roleObj.roleId) === false):
                        await interact.reply({ content: checkMessage, ephemeral: true })
                        break
                    default:
                        // fetch options
                        const fetchOptions = {
                            method: fetchMethod,
                            headers: {
                                Authorization: `Bot ${process.env.TOKEN}`
                            }
                        }
                        // manage role fetch
                        const manageRoleResult = await fetcherManageRole(roleEndpoint, fetchOptions)
                        // success manage role to user 
                        if(manageRoleResult) await interact.editReply({ content: successMessage })
                        // failed to manage role to user 
                        else await interact.editReply({ content: failedMessage })
                }
            } catch (error) {
                console.log(error);
                await fetcherWebhook(this.interact.commandName, error)
            }
        }
    }

    async weather() {
        try {
            const inputDisplay = this.interact.options.get('display')?.value || null
            // defer reply
            if(inputDisplay == null) await this.interact.deferReply({ ephemeral: true })
            else await this.interact.deferReply({ flags: '4096' })
    
            // user input
            const inputCity = this.interact.options.get('city').value
            const inputType = this.interact.options.get('type').value
            // fetch materials
            const weatherParams = {
                type: inputType,
                key: process.env.WEATHER_API_KEY,
                query: inputCity
            }
            const weatherEndpoint = `http://api.weatherapi.com/v1/forecast.json?key=${weatherParams.key}&q=${weatherParams.query}&days=2`
            const fetchOptions = {
                method: 'GET'
            }
            // get weather api data
            const fetchWeather = await fetcherWeather(weatherEndpoint, fetchOptions, weatherParams.type)
            // destructure data
            const { perDay, perHour } = fetchWeather
            // ------------- PER DAY STUFF -------------
            // ------------- PER DAY STUFF -------------
            const weatherPerDayDescription = "Data cuaca didapat dari weather.com" +
                                        "\n───────────────────" +
                                        "\n`Versi   :` Ringkasan" +
                                        "\n───────────────────" 
            // field value                            
            // nullable = time, feelslike, rain_chance
            const weatherPerDayContent = "\n`kota       :` " + perDay.city +
                                    "\n`wilayah    :` " + perDay.region +
                                    (perDay.time ? "\n`waktu      :` " + perDay.time : "\u2008") +
                                    "\n`suhu       :` " + perDay.temp +
                                    (perDay.temp_feelslike ? " terasa seperti " + perDay.temp_feelslike : "\u2008") +
                                    "\n`kondisi    :` " + weatherConditionTranslate(perDay.condition) +
                                    "\n`curah hujan:` " + weatherPrecipitation(perDay.precip) +
                                    "\n`kelembapan :` " + perDay.humidity +
                                    (perDay.rain_chance ? "\n`kemungkinan hujan :` " + perDay.rain_chance : "\u2008") 
            // weather perDay embed 
            const weatherPerDayEmbed = new EmbedBuilder()
                .setTitle('Laporan Cuaca Indog :cloud: :sunglasses: :thermometer:')
                .setDescription(weatherPerDayDescription)
                .setThumbnail(`https:${perDay.img}`)
                .addFields({
                    name: perDay.date.match(new Date().getDate()) ? 
                        `${perDay.date} (today)`
                        : 
                        `${perDay.date} (tomorrow)`,
                    value: weatherPerDayContent
                })
            // ------------- PER HOUR STUFF -------------
            // ------------- PER HOUR STUFF -------------
            const weatherPerHourDescription = "Data cuaca didapat dari weather.com" +
                                            "\n────────────────────────────" +
                                            "\n:arrow_lower_right: : `ringan` :last_quarter_moon: : `tdk merata`" +
                                            "│ `Versi   :` Per beberapa jam" +
                                            "\n:left_right_arrow: : `sedang` :shower: : `sebentar  `" +
                                            "│ `Kota    :` " + perHour[0].city +
                                            "\n:arrow_upper_right: : `lebat ` :cold_face: : `dingin    `" +
                                            "│ `Wilayah :` " + perHour[0].region +
                                            "\n────────────────────────────" 
            const weatherPerHourEmbed = new EmbedBuilder()
            .setTitle('Laporan Cuaca Indog :cloud: :sunglasses: :thermometer:')
            .setDescription(weatherPerHourDescription)
            for(let i in perHour) {
                // field value
                const weatherPerHourContent = "\n`suhu asli   :` " + perHour[i].temp + 
                                        "\n`suhu seperti:` " + perHour[i].temp_feelslike + 
                                        "\n`akan hujan  :` " + perHour[i].rain_chance
                // weather perHour embed
                weatherPerHourEmbed.addFields({
                    name: weatherFieldName(+i, perHour[i].date, perHour[i].time, perHour[i].img, fetchWeather.firstHour),
                    value: weatherPerHourContent,
                    inline: true
                })
            }
            // send reply
            // reply with ephemeral
            if(inputDisplay === null) {
                const weatherEmbeds = [weatherPerDayEmbed, weatherPerHourEmbed]
                await replyPagination(this.interact, weatherEmbeds)
            }
            // reply for everyone
            else {
                return await this.interact.editReply({ embeds: [weatherPerDayEmbed] })
            }
        } catch (error) {
            console.log(error);
            await fetcherWebhook(this.interact.commandName, error)
        }
    }
}

module.exports = MiscCommands