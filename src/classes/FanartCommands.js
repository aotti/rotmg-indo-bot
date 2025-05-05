const { TwitterApi } = require("twitter-api-v2");
const { fetcherWebhook, fetcherNotLocal } = require("../../helper/fetcher");

class FanartCommands {
    constructor(interact) {
        this.interact = interact
        this.twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN)
        this.redisClient = require('../../database/redis')
    }

    async getNewFanart() {
        // fanart stuff
        let fanartPosting = null
        const tweetAmount = 3
        const fanartHours = 4
        const fanartInterval = fanartHours * (3_600 * 1e3)
        try {
            await this.interact.deferReply();
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
            // post fanart every 8 hours
            fanartPosting = setInterval(async () => {
                if(authorUsernameList.length === 0) {
                    clearInterval(fanartPosting)
                    return await fanartChannel.send({ content: 'no more fanart today 😭' })
                }
                console.log('getting author', authorUsernameList[0]);
                // find author
                const author = await this.twitterClient.v2.userByUsername(authorUsernameList[0])
                if(!author.data) return await fanartChannel.send({ content: 'author not found' })
                // author found
                // get author timeline data
                console.log('getting fanart');
                
                const authorTimeline = await this.twitterClient.v2.userTimeline(author.data.id, {
                    max_results: tweetAmount,
                    "tweet.fields": ['attachments', 'entities'],
                    expansions: ['attachments.media_keys'],
                    "media.fields": ['url', 'type'],
                })
                // console.log('origin timeline', authorTimeline.data.data);
                // ### DONT RE-ROLL AUTHOR
                // re-roll author list
                const prevAuthor = authorUsernameList.shift()
                // authorUsernameList.push(prevAuthor)
                
                let fanartContent = `there is no new fanart 😭`
                // filter tweets without attachment
                const filtetedAuthorTimeline = authorTimeline.data.data.filter(tweet => tweet?.attachments != null)
                // console.log('filter timeline', filtetedAuthorTimeline);
                
                // there is no new fanart
                if(filtetedAuthorTimeline.length === 0)
                    return await fanartChannel.send({ content: `${fanartContent}` })
                // get posted fanart list
                const getPostedFanarts = await this.redisClient.get('rotmgIndoFanart') || []
                // loop tweets
                console.log('posting fanart');
                
                for(let tweet of filtetedAuthorTimeline) {
                    // check if fanart was posted
                    const isFanartPosted = getPostedFanarts.indexOf(tweet.id)
                    if(isFanartPosted !== -1) {
                        fanartContent = `fanart already posted (${author.data.username}) 💀`
                        return await fanartChannel.send({ content: fanartContent })
                    }
                    // there is fanart, set fanart link
                    fanartContent = `https://fixvx.com/${author.data.username}/status/${tweet.id}`
                    // send fanart to discord
                    await fanartChannel.send({ content: fanartContent })
                    // save tweet id to redis
                    return await this.redisClient.set('rotmgIndoFanart', [`${tweet.id}`])
                }
            }, fanartInterval);
            // fanart interval started
            return await this.interact.editReply({ content: `getting new fanart every ${fanartHours} hours` })
        } catch (error) {
            // stop fanart post on error
            fanartPosting ? clearInterval(fanartPosting) : null
            console.log(error);
            await fetcherWebhook(this.interact.commandName, error)
        }
    }
}

module.exports = FanartCommands