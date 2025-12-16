#!/bin/bash
#
#

export REGION="us-east-1"

#Set your Lambda function nam
LAMBDA_FUNCTION_NAME="entdata-dev-lambda-createCustomer"

#JSON input for Lambda
JSON_INPUT={"name":"ChatGPT"}

#Invoke AWS Lambda function using AWS CLI
echo "Calling AWS Lambda function: $LAMBDA_FUNCTION_NAME with JSON input..."
aws lambda invoke \
    --function-name $LAMBDA_FUNCTION_NAME \
    --payload "" \
    response.json

# Display the response from the Lambda invocation
echo "Response from Lambda function:"
cat response.json

# Clean up(optional)
rm response.json