const { TwitterApi } = require("twitter-api-v2");
const { fetcherWebhook, fetcherNotLocal } = require("../../helper/fetcher");
const { checkDeveloper } = require("../replyHelper");
const { SignJWT, jwtVerify } = require('jose')

class FanartCommands {
    #twitterClientData
    #twitterClient
    #timeoutSecret = new TextEncoder().encode(process.env.TIMEOUT_TOKEN_SECRET)

    constructor(interact) {
        this.interact = interact
        this.redisClient = require('../../database/redis')
        // this.twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN_2)
    }
    
    async #checkFanartApiCounter() {
        const getTwitterClientData = await this.redisClient.get('rotmgIndoFanartCounter')
        let tempTwitterClientData = null
        let isChangeToken = false
        // fanart counter exist
        if(getTwitterClientData && getTwitterClientData.length > 0) {
            // loop
            for(let data of getTwitterClientData) {
                // change twitter api token if the counter on limit (100 for free tier)
                if(data.counter >= 100) {
                    // check timeout token
                    const isExpired = await jwtVerify(data.timeout_token, this.#timeoutSecret)
                    // token not expired, turn off fanart token
                    if(isExpired?.payload) {
                        data.status = 'off'
                        isChangeToken = true
                    }
                    // token is expired, reset data 
                    else {
                        data.counter = 0
                        data.status = 'on'
                        data.timeout_token = await this.#generateTimeoutToken(data.name)
                        tempTwitterClientData = data
                    }
                }
                else if(data.counter < 100) {
                    // check data status
                    if(data.status === 'on') {
                        tempTwitterClientData = data
                    }
                    // change token data after the other is turned off
                    if(data.status === 'off' && isChangeToken) {
                        data.status = 'on'
                        tempTwitterClientData = data
                    }
                }
            }
            // update data to redis
            await this.redisClient.set('rotmgIndoFanartCounter', getTwitterClientData)
            return tempTwitterClientData
        }
        // fanart counter not exist
        else {
            const newFanartCounterData = [
                {
                    name: 'fanart_token_1', 
                    fanart_token: process.env.TWITTER_BEARER_TOKEN_1,
                    timeout_token: await this.#generateTimeoutToken('fanart_token_1'),
                    counter: 0,
                    status: 'on',
                },
                {
                    name: 'fanart_token_2', 
                    fanart_token: process.env.TWITTER_BEARER_TOKEN_2,
                    timeout_token: await this.#generateTimeoutToken('fanart_token_2'),
                    counter: 0,
                    status: 'off',
                },
            ]
            // save new data to redis
            await this.redisClient.set('rotmgIndoFanartCounter', newFanartCounterData)
            return newFanartCounterData
        }
    }

    async #generateTimeoutToken(name) {
        const jwt = await new SignJWT({name})
                    .setProtectedHeader({ alg: 'HS256' })
                    .setIssuer('rotmg indo')
                    .setExpirationTime('30d')
                    .sign(this.#timeoutSecret)
        return jwt
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

                // check fanart counter before get fanart
                this.#twitterClientData = await this.#checkFanartApiCounter()
                const currentTokenCounterText = `${this.#twitterClientData.name}: ${100-this.#twitterClientData.counter} left`
                // console.log(this.#twitterClientData);
                // both token are on limit, cannot get fanart
                if(!this.#twitterClientData) return await this.interact.editReply({ content: `elon pepek pelit` })
                // initialize twitter client
                this.#twitterClient = new TwitterApi(this.#twitterClientData.fanart_token)
                
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
                return await this.interact.editReply({
                    content: `getting new fanart every ${fanartHours} hours\n${currentTokenCounterText}`
                })
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
        return await this.#twitterClient.v2.userTimeline(authorId, {
            max_results: tweetAmount,
            "tweet.fields": ['attachments', 'entities'],
            expansions: ['attachments.media_keys'],
            "media.fields": ['url', 'type'],
        })
    }

    async #postFanart(fanartChannel, authorUsername, tweetAmount) {
        console.log('getting author', authorUsername);
        
        const getTwitterClientData = await this.redisClient.get('rotmgIndoFanartCounter')
        const findTwitterClientData = getTwitterClientData.map(v => v.name).indexOf(this.#twitterClientData.name)
        // find author
        const author = await this.#twitterClient.v2.userByUsername(authorUsername)
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
        if(filteredAuthorTimeline.length === 0) {
            await fanartChannel.send({ content: `${fanartContent}` })
            // manual twitter api counter
            getTwitterClientData[findTwitterClientData].counter += 5
            // update fanart counter to redis
            return await this.redisClient.set('rotmgIndoFanartCounter', getTwitterClientData)
        }
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
        // manual twitter api counter
        getTwitterClientData[findTwitterClientData].counter += 5
        // update fanart counter to redis
        await this.redisClient.set('rotmgIndoFanartCounter', getTwitterClientData)
    }
}

module.exports = FanartCommands