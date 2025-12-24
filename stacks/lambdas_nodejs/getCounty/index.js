const { getRegionById } = require('./data/getRegion.js');
const { getDBConfig } = require('./aurora-db.js')

exports.handler = async (event) => {
    
    try {
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
        
    } catch (error) {
        console.error('Database error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'Database error',
                error: error.message
            })
        };
    }
};
