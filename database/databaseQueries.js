const supabase = require('../database/database')

function selectOne(query) {
    // find username in database
    if(supabase == null)
        return console.log('cannot connect to database');
    // get data from supabase
    const selectOneDataFromDB = async () => {
        const {data, error} = await supabase.from(query.table)
                            .select(query.selectColumn)
                            .eq(query.whereColumn, query.whereValue)
        return {data: data, error: error}
    }
    return selectOneDataFromDB()
}

function insertDataRow(query) {
    if(supabase == null)
        return console.log('cannot connect to database');
    const insertDataToDB = async () => {
        // insert player data who joined the game
        const {data, error} = await supabase.from(query.table)
                            // [] means insert multiple values 
                            .insert([query.insertColumn])
                            .select(query.selectColumn)
        return {data: data, error: error}
    }
    return insertDataToDB()
}

function updateData(query) {
    if(supabase == null)
        return console.log('cannot connect to database');
    const updateDataToDB = async () => {
        const {data, error} = await supabase.from(query.table)
                            .update(query.updateColumn)
                            .eq(query.whereColumn, query.whereValue)
                            .select(query.selectColumn)
        return {data: data, error: error}
    }
    return updateDataToDB()
}

module.exports = {
    selectOne,
    insertDataRow,
    updateData
}