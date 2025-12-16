/**
 * Get County Lambda Function
 * Handles multiple API endpoints for retrieving county configuration data
 */

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

// Environment variables from CloudFormation
const STAGE = process.env.STAGE || 'dev';
const USERDETAILS_DATA_GET_LAMBDA = process.env.userdetailsDATA_GET_DATA_LAMBDA;

/**
 * Main Lambda handler
 * Routes requests based on the API path
 */
exports.handler = async (event, context) => {
    console.log('Event received:', JSON.stringify(event, null, 2));
    
    try {
        // Get the path from the event
        const path = event.path || event.resource;
        const httpMethod = event.httpMethod;
        const queryParams = event.queryStringParameters || {};
        const body = event.body ? JSON.parse(event.body) : {};
        
        console.log(`Request: ${httpMethod} ${path}`);
        console.log('Query params:', queryParams);
        console.log('Body:', body);
        
        // Route based on path
        let result;
        switch (path) {
            case '/getCountyByAppAndUser':
                result = await getCountyByAppAndUser(queryParams, body);
                break;
            case '/getCountyByApp':
                result = await getCountyByApp(queryParams, body);
                break;
            case '/getCountyByConfigId':
                result = await getCountyByConfigId(queryParams, body);
                break;
            case '/getCountyByConfigType':
                result = await getCountyByConfigType(queryParams, body);
                break;
            case '/getCountyByConfigTypeAndConfigId':
                result = await getCountyByConfigTypeAndConfigId(queryParams, body);
                break;
            case '/getCountyByDataTypeAndDataId':
                result = await getCountyByDataTypeAndDataId(queryParams, body);
                break;
            case '/getCountyByDataTypeAndConfigId':
                result = await getCountyByDataTypeAndConfigId(queryParams, body);
                break;
            case '/getCountyByDataIdAndDataType':
                result = await getCountyByDataIdAndDataType(queryParams, body);
                break;
            case '/getCountyByDataTypeAndDataStatus':
                result = await getCountyByDataTypeAndDataStatus(queryParams, body);
                break;
            case '/getCountyByDataTypeAndUpdateBy':
                result = await getCountyByDataTypeAndUpdateBy(queryParams, body);
                break;
            case '/getCountyByUser':
                result = await getCountyByUser(queryParams, body);
                break;
            default:
                return {
                    statusCode: 404,
                    headers: getCorsHeaders(),
                    body: JSON.stringify({ 
                        error: 'Not Found',
                        message: `Path ${path} not found`,
                        availablePaths: [
                            '/getCountyByAppAndUser',
                            '/getCountyByApp',
                            '/getCountyByConfigId',
                            '/getCountyByConfigType',
                            '/getCountyByConfigTypeAndConfigId',
                            '/getCountyByDataTypeAndDataId',
                            '/getCountyByDataTypeAndConfigId',
                            '/getCountyByDataIdAndDataType',
                            '/getCountyByDataTypeAndDataStatus',
                            '/getCountyByDataTypeAndUpdateBy',
                            '/getCountyByUser'
                        ]
                    })
                };
        }
        
        return {
            statusCode: 200,
            headers: getCorsHeaders(),
            body: JSON.stringify(result)
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                error: 'Internal Server Error',
                message: error.message,
                stage: STAGE
            })
        };
    }
};

/**
 * Get county data by application and user
 */
async function getCountyByAppAndUser(queryParams, body) {
    const app = queryParams.app || body.app;
    const user = queryParams.user || body.user;
    
    if (!app || !user) {
        throw new Error('Missing required parameters: app and user');
    }
    
    // Call the data lambda if configured
    if (USERDETAILS_DATA_GET_LAMBDA) {
        return await invokeDataLambda({
            operation: 'getCountyByAppAndUser',
            app,
            user
        });
    }
    
    // Mock response for testing
    return {
        message: 'getCountyByAppAndUser',
        app,
        user,
        data: {
            countyId: 'COUNTY_001',
            countyName: 'Sample County',
            configuration: {}
        }
    };
}

/**
 * Get county data by application
 */
async function getCountyByApp(queryParams, body) {
    const app = queryParams.app || body.app;
    
    if (!app) {
        throw new Error('Missing required parameter: app');
    }
    
    if (USERDETAILS_DATA_GET_LAMBDA) {
        return await invokeDataLambda({
            operation: 'getCountyByApp',
            app
        });
    }
    
    return {
        message: 'getCountyByApp',
        app,
        data: []
    };
}

/**
 * Get county by config ID
 */
async function getCountyByConfigId(queryParams, body) {
    const configId = queryParams.configId || body.configId;
    
    if (!configId) {
        throw new Error('Missing required parameter: configId');
    }
    
    if (USERDETAILS_DATA_GET_LAMBDA) {
        return await invokeDataLambda({
            operation: 'getCountyByConfigId',
            configId
        });
    }
    
    return {
        message: 'getCountyByConfigId',
        configId,
        data: null
    };
}

/**
 * Get county by config type
 */
async function getCountyByConfigType(queryParams, body) {
    const configType = queryParams.configType || body.configType;
    
    if (!configType) {
        throw new Error('Missing required parameter: configType');
    }
    
    if (USERDETAILS_DATA_GET_LAMBDA) {
        return await invokeDataLambda({
            operation: 'getCountyByConfigType',
            configType
        });
    }
    
    return {
        message: 'getCountyByConfigType',
        configType,
        data: []
    };
}

/**
 * Get county by config type and config ID
 */
async function getCountyByConfigTypeAndConfigId(queryParams, body) {
    const configType = queryParams.configType || body.configType;
    const configId = queryParams.configId || body.configId;
    
    if (!configType || !configId) {
        throw new Error('Missing required parameters: configType and configId');
    }
    
    if (USERDETAILS_DATA_GET_LAMBDA) {
        return await invokeDataLambda({
            operation: 'getCountyByConfigTypeAndConfigId',
            configType,
            configId
        });
    }
    
    return {
        message: 'getCountyByConfigTypeAndConfigId',
        configType,
        configId,
        data: null
    };
}

/**
 * Get county by data type and data ID
 */
async function getCountyByDataTypeAndDataId(queryParams, body) {
    const dataType = queryParams.dataType || body.dataType;
    const dataId = queryParams.dataId || body.dataId;
    
    if (!dataType || !dataId) {
        throw new Error('Missing required parameters: dataType and dataId');
    }
    
    if (USERDETAILS_DATA_GET_LAMBDA) {
        return await invokeDataLambda({
            operation: 'getCountyByDataTypeAndDataId',
            dataType,
            dataId
        });
    }
    
    return {
        message: 'getCountyByDataTypeAndDataId',
        dataType,
        dataId,
        data: null
    };
}

/**
 * Get county by data type and config ID
 */
async function getCountyByDataTypeAndConfigId(queryParams, body) {
    const dataType = queryParams.dataType || body.dataType;
    const configId = queryParams.configId || body.configId;
    
    if (!dataType || !configId) {
        throw new Error('Missing required parameters: dataType and configId');
    }
    
    if (USERDETAILS_DATA_GET_LAMBDA) {
        return await invokeDataLambda({
            operation: 'getCountyByDataTypeAndConfigId',
            dataType,
            configId
        });
    }
    
    return {
        message: 'getCountyByDataTypeAndConfigId',
        dataType,
        configId,
        data: []
    };
}

/**
 * Get county by data ID and data type
 */
async function getCountyByDataIdAndDataType(queryParams, body) {
    const dataId = queryParams.dataId || body.dataId;
    const dataType = queryParams.dataType || body.dataType;
    
    if (!dataId || !dataType) {
        throw new Error('Missing required parameters: dataId and dataType');
    }
    
    if (USERDETAILS_DATA_GET_LAMBDA) {
        return await invokeDataLambda({
            operation: 'getCountyByDataIdAndDataType',
            dataId,
            dataType
        });
    }
    
    return {
        message: 'getCountyByDataIdAndDataType',
        dataId,
        dataType,
        data: null
    };
}

/**
 * Get county by data type and data status
 */
async function getCountyByDataTypeAndDataStatus(queryParams, body) {
    const dataType = queryParams.dataType || body.dataType;
    const dataStatus = queryParams.dataStatus || body.dataStatus;
    
    if (!dataType || !dataStatus) {
        throw new Error('Missing required parameters: dataType and dataStatus');
    }
    
    if (USERDETAILS_DATA_GET_LAMBDA) {
        return await invokeDataLambda({
            operation: 'getCountyByDataTypeAndDataStatus',
            dataType,
            dataStatus
        });
    }
    
    return {
        message: 'getCountyByDataTypeAndDataStatus',
        dataType,
        dataStatus,
        data: []
    };
}

/**
 * Get county by data type and updated by user
 */
async function getCountyByDataTypeAndUpdateBy(queryParams, body) {
    const dataType = queryParams.dataType || body.dataType;
    const updateBy = queryParams.updateBy || body.updateBy;
    
    if (!dataType || !updateBy) {
        throw new Error('Missing required parameters: dataType and updateBy');
    }
    
    if (USERDETAILS_DATA_GET_LAMBDA) {
        return await invokeDataLambda({
            operation: 'getCountyByDataTypeAndUpdateBy',
            dataType,
            updateBy
        });
    }
    
    return {
        message: 'getCountyByDataTypeAndUpdateBy',
        dataType,
        updateBy,
        data: []
    };
}

/**
 * Get county by user
 */
async function getCountyByUser(queryParams, body) {
    const user = queryParams.user || body.user;
    
    if (!user) {
        throw new Error('Missing required parameter: user');
    }
    
    if (USERDETAILS_DATA_GET_LAMBDA) {
        return await invokeDataLambda({
            operation: 'getCountyByUser',
            user
        });
    }
    
    return {
        message: 'getCountyByUser',
        user,
        data: []
    };
}

/**
 * Invoke the data layer Lambda function
 */
async function invokeDataLambda(payload) {
    console.log(`Invoking data lambda: ${USERDETAILS_DATA_GET_LAMBDA}`);
    console.log('Payload:', payload);
    
    const params = {
        FunctionName: USERDETAILS_DATA_GET_LAMBDA,
        Payload: JSON.stringify(payload)
    };
    
    try {
        const result = await lambda.invoke(params).promise();
        const response = JSON.parse(result.Payload);
        return response;
    } catch (error) {
        console.error('Error invoking data lambda:', error);
        throw new Error(`Failed to invoke data lambda: ${error.message}`);
    }
}

/**
 * CORS headers for API responses
 */
function getCorsHeaders() {
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,X-Amz-Security-Token,Authorization,X-Api-Key,X-Requested-With,Accept,Access-Control-Allow-Methods,Access-Control-Allow-Origin,Access-Control-Allow-Headers'
    };
}
