const { getDBConfig } = require('./aurora-db.js');
const { getRegion } = require('./data/getRegion.js');
exports.handler = async (event) => {
    
    try {
        switch (event.resource) {
            case '/getRegion':
                // return await getRegion(event);
                const result = await getDBConfig();
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify(result)
                };
                
            default:
                return {
                    statusCode: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ code: 'NOT_FOUND', message: 'Resource not found' })
                };
        }
        

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
