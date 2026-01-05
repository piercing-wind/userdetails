const getLocality = require('./data/getLocality.js');
const getRegion = require('./data/getRegion.js');

exports.handler = async (event) => {
    
    try {
        let result;
        switch (event.resource) {
            case '/{ProjectId}/{Environment}/region/{id}':
            case '/{ProjectId}/{Environment}/region':
                result = await getRegion(event);
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify(result)
                }
            case '/{ProjectId}/{Environment}/locality':
                result = await getLocality(event);
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify(result)
                }

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
