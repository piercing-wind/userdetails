/**
 * UserDetails VPC Test Lambda
 * Simple test function to verify VPC connectivity and Lambda execution
 */

const AWS = require('aws-sdk');

exports.handler = async (event, context) => {
    console.log('VPC Test Lambda invoked');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    const stage = process.env.STAGE || 'unknown';
    
    try {
        // Basic connectivity test
        const response = {
            message: 'UserDetails VPC Test Lambda is working!',
            stage: stage,
            timestamp: new Date().toISOString(),
            environment: {
                STAGE: process.env.STAGE,
                AWS_REGION: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION,
                RUST_BACKTRACE: process.env.RUST_BACKTRACE,
                TIMEDELTA_PERIOD: process.env.TIMEDELTA_PERIOD,
                TIMEDELTA_VALUE: process.env.TIMEDELTA_VALUE
            },
            lambdaInfo: {
                functionName: context.functionName,
                functionVersion: context.functionVersion,
                memoryLimitInMB: context.memoryLimitInMB,
                logGroupName: context.logGroupName,
                requestId: context.requestId
            }
        };
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(response, null, 2)
        };
        
    } catch (error) {
        console.error('Error in test lambda:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Test failed',
                message: error.message,
                stage: stage
            })
        };
    }
};
