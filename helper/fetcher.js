function fetcher(url, singleData = true) {
    return fetch(url, {
        method: 'GET'
    })
    .then(data => { return data.json() })
    .then(api_result => {
        const checkProfileInfo = api_result.error == null
        if(singleData) {
            // data from api
            const { PlayerName, Rank, Guild, Created, FirstSeen, LastSeen } = api_result.ProfileInfo
            // set reply message
            const api_resultObj = {
                username: PlayerName,
                rank: `${Rank} ☆`,
                guild: Guild,
                created: FirstSeen || Created,
                lastSeen: LastSeen,
                // prevent error from hidden profile on realmeye
                status: checkProfileInfo && +api_result?.ProfileInfo.Fame.split(' ')[0] > 0 ? 'aktif' : 'quit'
            }
            return api_resultObj
        }
        else {
            // set reply message
            const api_resultObj = {
                // data from api
                // prevent error from hidden profile on realmeye
                status: checkProfileInfo && +api_result?.ProfileInfo.Fame.split(' ')[0] > 0 ? '**aktif**' : 'quit'
            }
            return api_resultObj
        }
    })
    .catch(err => {
        console.log(err);
    })
}

module.exports = {
    fetcher
}