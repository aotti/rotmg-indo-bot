const supabase = require('../database/database')

function selectAll(query) {
    if(supabase == null)
    return console.log('cannot connect to database');
    // get all data from supabase
    const selectAllDataFromDB = async () => {
        const {data, error} = await supabase.from(query.table)
                            .select(query.selectColumn)
                            .order('id', {ascending: true})
        return {data: data, error: error}
    }
    return selectAllDataFromDB()
}

function selectOne(query) {
    if(supabase == null)
        return console.log('cannot connect to database');
    // get one data from supabase
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
        // insert player data 
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
    selectAll,
    selectOne,
    insertDataRow,
    updateData
}