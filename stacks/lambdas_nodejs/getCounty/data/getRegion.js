const { query } = require('../aurora-db.js');

async function getRegion(event) {

    // Get query parameters
    const regionCode = event?.queryStringParameters?.regionCode || event?.queryStringParameters?.regioncode;
    
    const result = await getRegionById(regionCode);
    const responseData = {
        count: result.count,
        data: result.data
    };
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
            'Access-Control-Allow-Methods': 'GET,OPTIONS'
        },
        body: JSON.stringify(responseData)
    };
    
}



async function getRegionById(regionCode) {
    const selectQuery = `
        SELECT * FROM regiondatadev_schema."Region"
    `;
    
    // If regionCode is provided, filter by it
    if (regionCode) {
        const result = await query(
            selectQuery + ' WHERE region_code = $1',
            [regionCode]
        );
        return result;
    }
    
    // Otherwise return all regions
    const result = await query(selectQuery + ' ORDER BY region_code');
    return result; 
}

module.exports = { getRegionById, getRegion};