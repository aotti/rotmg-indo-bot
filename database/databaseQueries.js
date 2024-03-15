const supabase = require('../database/database')

function selectAll(query) {
    if(supabase == null)
        return console.log('cannot connect to database');
    // get all data from supabase
    const selectAllDataFromDB = async () => {
        const columnOrder = query.orderBy || 'id'
        const {data, error} = query.whereColumn ? 
                            // with where clause
                            await supabase.from(query.table)
                            .select(query.selectColumn)
                            .eq(query.whereColumn, query.whereValue)
                            .order(columnOrder, {ascending: true})
                            :
                            // get all data
                            await supabase.from(query.table)
                            .select(query.selectColumn)
                            .order(columnOrder, {ascending: true})
        return {data: data, error: error}
    }
    return selectAllDataFromDB()
}

function selectOne(query) {
    if(supabase == null)
        return console.log('cannot connect to database');
    // get one data from supabase
    const selectOneDataFromDB = async () => {
        const {data, error} = Array.isArray(query.whereColumn) ?
                            // multiple where TRUE
                            await supabase.from(query.table)
                            .select(query.selectColumn)
                            .eq(query.whereColumn[0], query.whereValue[0])
                            .eq(query.whereColumn[1], query.whereValue[1])
                            :
                            // multiple where FALSE
                            await supabase.from(query.table)
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

function queryBuilder(table, selectColumn, whereColumn = null, whereValue = null, action = null, orderBy = null) {
    const qb = {}
    // target table
    qb.table = table
    // select which columns wanna display 
    const choosenColumns = []
    // 1 = username, 2 = alias, 3 = region, 4 = status
    for(let col of selectColumn.toString().split('')) {
        switch(+col) {
            // table players
            case 1: choosenColumns.push('username'); break
            case 2: choosenColumns.push('alias'); break
            case 3: choosenColumns.push('region'); break
            // table schedules
            case 4: choosenColumns.push('title'); break
            case 5: choosenColumns.push('date'); break
            case 6: choosenColumns.push('description'); break
            case 7: choosenColumns.push('reminder_time'); break
            // both table have status column
            case 8: choosenColumns.push('id'); break
            case 9: choosenColumns.push('status'); break
        }
    }
    qb.selectColumn = choosenColumns.join(', ')
    // the column used as the search area
    if(whereColumn) qb.whereColumn = whereColumn
    // the value used to search data in whereColumn
    if(whereValue) qb.whereValue = whereValue
    // order data by column
    if(orderBy) qb.orderBy = orderBy
    // action used to insert / update / delete a row (select query doesnt need action)
    if(action) {
        switch(action.type) {
            case 'insert':
                Object.defineProperties(qb, {
                    insertColumn: {
                        get: function () { return action.obj }, enumerable: true
                    }
                })
                break
            case 'update':
                Object.defineProperties(qb, {
                    updateColumn: {
                        get: function () { return action.obj }, enumerable: true
                    }
                })
                break
        }
    }
    // return object
    return qb
}

module.exports = {
    selectAll,
    selectOne,
    insertDataRow,
    updateData,
    queryBuilder
}