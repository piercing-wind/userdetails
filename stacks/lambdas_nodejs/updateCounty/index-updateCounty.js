/**
 * Update County Lambda Function
 * Handles creating, updating, and deleting county configurations
 */

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

// Environment variables from CloudFormation
const STAGE = process.env.STAGE || 'dev';
const USERDETAILS_DATA_UPSERT_LAMBDA = process.env.userdetailsDATA_UPSERT_LAMBDA;
const USERDETAILS_DATA_GET_LAMBDA = process.env.userdetailsDATA_GET_DATA_LAMBDA;

/**
 * Main Lambda handler
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
            case '/updateCounty':
                result = await updateCounty(body);
                break;
            case '/deleteConfigById':
                result = await deleteConfigById(queryParams, body);
                break;
            default:
                return {
                    statusCode: 404,
                    headers: getCorsHeaders(),
                    body: JSON.stringify({ 
                        error: 'Not Found',
                        message: `Path ${path} not found`,
                        availablePaths: [
                            '/updateCounty',
                            '/deleteConfigById'
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
 * Update or create county configuration
 */
async function updateCounty(data) {
    console.log('Updating county with data:', data);
    
    // Validate required fields
    if (!data.configId && !data.countyId) {
        throw new Error('Missing required parameter: configId or countyId');
    }
    
    // Prepare the data for upsert
    const upsertData = {
        ...data,
        updatedAt: new Date().toISOString(),
        stage: STAGE
    };
    
    // If upsert lambda is configured, use it
    if (USERDETAILS_DATA_UPSERT_LAMBDA) {
        return await invokeUpsertLambda({
            operation: 'upsert',
            data: upsertData
        });
    }
    
    // Mock response for testing
    return {
        message: 'County configuration updated successfully',
        data: upsertData,
        success: true
    };
}

/**
 * Delete configuration by ID
 */
async function deleteConfigById(queryParams, body) {
    const configId = queryParams.configId || body.configId;
    
    if (!configId) {
        throw new Error('Missing required parameter: configId');
    }
    
    console.log(`Deleting configuration: ${configId}`);
    
    // First, verify the config exists (using get lambda)
    if (USERDETAILS_DATA_GET_LAMBDA) {
        try {
            const existingConfig = await invokeGetLambda({
                operation: 'getCountyByConfigId',
                configId
            });
            
            if (!existingConfig) {
                throw new Error(`Configuration not found: ${configId}`);
            }
        } catch (error) {
            console.error('Error checking existing config:', error);
        }
    }
    
    // Perform delete via upsert lambda (soft delete or hard delete)
    if (USERDETAILS_DATA_UPSERT_LAMBDA) {
        return await invokeUpsertLambda({
            operation: 'delete',
            configId
        });
    }
    
    // Mock response for testing
    return {
        message: 'Configuration deleted successfully',
        configId,
        success: true
    };
}

/**
 * Invoke the upsert data Lambda function
 */
async function invokeUpsertLambda(payload) {
    console.log(`Invoking upsert lambda: ${USERDETAILS_DATA_UPSERT_LAMBDA}`);
    console.log('Payload:', payload);
    
    const params = {
        FunctionName: USERDETAILS_DATA_UPSERT_LAMBDA,
        Payload: JSON.stringify(payload)
    };
    
    try {
        const result = await lambda.invoke(params).promise();
        const response = JSON.parse(result.Payload);
        
        if (result.FunctionError) {
            throw new Error(`Lambda error: ${response.errorMessage || 'Unknown error'}`);
        }
        
        return response;
    } catch (error) {
        console.error('Error invoking upsert lambda:', error);
        throw new Error(`Failed to invoke upsert lambda: ${error.message}`);
    }
}

/**
 * Invoke the get data Lambda function
 */
async function invokeGetLambda(payload) {
    console.log(`Invoking get data lambda: ${USERDETAILS_DATA_GET_LAMBDA}`);
    console.log('Payload:', payload);
    
    const params = {
        FunctionName: USERDETAILS_DATA_GET_LAMBDA,
        Payload: JSON.stringify(payload)
    };
    
    try {
        const result = await lambda.invoke(params).promise();
        const response = JSON.parse(result.Payload);
        
        if (result.FunctionError) {
            throw new Error(`Lambda error: ${response.errorMessage || 'Unknown error'}`);
        }
        
        return response;
    } catch (error) {
        console.error('Error invoking get lambda:', error);
        throw new Error(`Failed to invoke get lambda: ${error.message}`);
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
