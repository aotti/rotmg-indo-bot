const { TwitterApi } = require("twitter-api-v2");
const { fetcherWebhook, fetcherNotLocal } = require("../../helper/fetcher");
const { checkDeveloper } = require("../replyHelper");

class FanartCommands {
    constructor(interact) {
        this.interact = interact
        this.twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN_2)
        this.redisClient = require('../../database/redis')
    }

    async postedFanart() {
        // get posted fanart list
        const getPostedFanarts = await this.redisClient.get('rotmgIndoFanart')
        console.log(getPostedFanarts);
    }

    getNewFanart() {
        return new Promise(async resolve => {
            // fanart stuff
            let fanartPosting = null
            const tweetAmount = 5
            const fanartHours = 4
            const fanartInterval = fanartHours * (3_600 * 1e3)
            await this.interact.deferReply();
            try {
                // only developer can run
                if(checkDeveloper(this.interact.user.id) === -1) {
                    return await this.interact.editReply({ content: `only developer 💀` })
                }
                // set fanart channel
                const fanartChannel = await this.interact.client.channels.fetch(process.env.FANART_CHANNEL)
                // get author list
                const afterQuery = 'after=1368147919739289730'
                const limitQuery = 'limit=1'
                const getMessagesURL = `https://discord.com/api/v10/channels/${process.env.FANART_CHANNEL}/messages?${afterQuery}&${limitQuery}`
                const fetchAuthorListOptions = {
                    method: 'GET',
                    headers: {
                        Authorization: `Bot ${process.env.TOKEN}`
                    }
                }
                const [fetchAuthorList] = await fetcherNotLocal(getMessagesURL, fetchAuthorListOptions)
                // get author list
                const authorUsernameList = fetchAuthorList.content.split(',')

                // ### COMMAND UNTUK MEMATIKAN FITUR
                // return await this.interact.editReply({ content: `tidak boleh ngabisin limit orang lain :juri:` })
                // set first fanart
                await this.#postFanart(fanartChannel, authorUsernameList[0], tweetAmount)   
                // remove author after post the fanart
                authorUsernameList.shift() 
                // post fanart every 8 hours
                fanartPosting = setInterval(async () => {
                    // post fanart
                    await this.#postFanart(fanartChannel, authorUsernameList[0], tweetAmount)
                    // remove author after post the fanart
                    authorUsernameList.shift()
                    // stop getting fanart if theres no more author
                    if(authorUsernameList.length === 0) {
                        clearInterval(fanartPosting)
                        await fanartChannel.send({ content: 'no more fanart today 😭' })
                        return resolve('fanart done')
                    }
                }, fanartInterval);
                // fanart interval started
                return await this.interact.editReply({ content: `getting new fanart every ${fanartHours} hours` })
            } catch (error) {
                // stop fanart post on error
                fanartPosting ? clearInterval(fanartPosting) : null
                console.log(error);
                // free tier usage cap exceed
                if(error.data?.title.match(/usagecap/i)) 
                    await this.interact.editReply({ content: `elon pepek pelit` })
                else if(error.data.title.match(/too many requests/i))
                    await this.interact.editReply({ content: `try again later` })
                await fetcherWebhook(this.interact.commandName, error)
            }
        })
    }

    async getAuthorTimeline(authorId, tweetAmount) {
        return await this.twitterClient.v2.userTimeline(authorId, {
            max_results: tweetAmount,
            "tweet.fields": ['attachments', 'entities'],
            expansions: ['attachments.media_keys'],
            "media.fields": ['url', 'type'],
        })
    }

    async #postFanart(fanartChannel, authorUsername, tweetAmount) {
        console.log('getting author', authorUsername);
        // find author
        const author = await this.twitterClient.v2.userByUsername(authorUsername)
        if(!author.data) return await fanartChannel.send({ content: `author ${authorUsername} not found` })
        // author found
        // get author timeline data
        console.log('getting fanart');
        
        const authorTimeline = await this.getAuthorTimeline(author.data.id, tweetAmount)
        // console.log('origin timeline', authorTimeline.data.data);
        
        // filter tweets without attachment
        const filteredAuthorTimeline = authorTimeline.data.data.filter(tweet => tweet?.attachments != null)
        // console.log('filter timeline', filteredAuthorTimeline);
        
        // there is no new fanart
        let fanartContent = `there is no new fanart 😭 (${authorUsername})`
        if(filteredAuthorTimeline.length === 0)
            return await fanartChannel.send({ content: `${fanartContent}` })
        // get posted fanart list
        const getPostedFanarts = await this.redisClient.get('rotmgIndoFanart')
        console.log('posting fanart');
        // check if fanart was posted
        const isFanartPosted = getPostedFanarts 
                            ? getPostedFanarts.indexOf(filteredAuthorTimeline[0].id) 
                            : [].indexOf(filteredAuthorTimeline[0].id)
        if(isFanartPosted !== -1) {
            fanartContent = `fanart already posted (${author.data.username}) 💀`
            return await fanartChannel.send({ content: fanartContent })
        }
        // there is fanart, set fanart link
        fanartContent = `https://fixvx.com/${author.data.username}/status/${filteredAuthorTimeline[0].id}`
        // send fanart to discord
        await fanartChannel.send({ content: fanartContent })
        // save tweet id to redis
        await this.redisClient.set('rotmgIndoFanart', [...getPostedFanarts, `${filteredAuthorTimeline[0].id}`])
    }
}

module.exports = FanartCommands