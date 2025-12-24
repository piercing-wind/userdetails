#!/bin/bash
#
# Backup AWS CodePipeline 
#


function check_error(){
if test $? -gt 0
then
    echo "$(basename $0) deploy failed @ $(date) ..."
    exit 1
fi
}



##
## MAIN
##


source ./build.conf
  check_error


# Override with DEV
export PROJECT_NAME=$PROJECT_NAME
export PROFILE=$DEV_PROFILE
# export ACCOUNT_NUMBER=$DEV_ACCOUNT_NUMBER
# export RELEASES_BUCKET="${RELEASES_BUCKET/_REPLACE_ACCOUNT_NUMBER_/"$ACCOUNT_NUMBER"}"
export ENV=$DEV_ENVIRONMENT
# export GITHUB_CONN_UUID=$DEV_GITHUB_CONN_UUID

echo "$(basename $0) executing with profile: $PROFILE"

echo "Create PROJECT= ${PROJECT_NAME}"

echo "Deploying IAM role that GitHub Actions will use..."
echo "Using AWS CLI profile: $PROFILE"

# Check if GitHub OIDC provider already exists
echo "Checking if GitHub OIDC provider already exists..."
OIDC_ARN=$(aws iam list-open-id-connect-providers --profile $PROFILE --output text 2>/dev/null | grep "token.actions.githubusercontent.com" | awk '{print $2}' || true)

if [ -z "$OIDC_ARN" ]; then
    echo "GitHub OIDC provider does not exist, creating it via AWS CLI..."
    aws iam create-open-id-connect-provider \
        --url https://token.actions.githubusercontent.com \
        --client-id-list sts.amazonaws.com \
        --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 1c58a3a8518e8759bf075b76b750d4f2df264fcd \
        --profile $PROFILE
    check_error
    echo "GitHub OIDC provider created successfully"
    
    # Get the ARN of the newly created provider
    OIDC_ARN=$(aws iam list-open-id-connect-providers --profile $PROFILE --output text 2>/dev/null | grep "token.actions.githubusercontent.com" | awk '{print $2}')
else
    echo "GitHub OIDC provider already exists: $OIDC_ARN"
fi

aws cloudformation deploy \
    --template-file stacks/github-actions-iam.yaml \
    --stack-name "${PROJECT_NAME}-github-actions-iam" \
    --parameter-overrides \
        ProjectId="${PROJECT_NAME}" \
        GithubOrg="${ORG_ID}" \
        GithubRepo="${PROJECT_NAME}" \
        CreateOIDCProvider="false" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region=$REGION \
    --profile $PROFILE
check_error

echo "Deploying CloudFormation stack..."

aws cloudformation deploy \
    --template-file tools/BASE_TOOLCHAIN/toolchain.yml \
    --stack-name "${PROJECT_NAME}-dev" \
    --parameter-overrides \
        ProjectId="${PROJECT_NAME}" \
        Environment=$ENV \
    --capabilities CAPABILITY_NAMED_IAM \
    --region=$REGION \
    --profile $PROFILE
check_error
    
echo "Waiting for stack creation..."
aws cloudformation wait stack-create-complete \
    --stack-name "${PROJECT_NAME}-dev" \
    --region=$REGION \
    --profile $PROFILE
check_error

ROLE_ARN=$(aws cloudformation describe-stacks \
    --stack-name "${PROJECT_NAME}-github-actions-iam" \
    --query 'Stacks[0].Outputs[?OutputKey==`GitHubActionsRoleArn`].OutputValue' \
    --output text \
    --region=$REGION \
    --profile $PROFILE)
echo "Add this to GitHub Secrets as AWS_ROLE_TO_ASSUME:"
echo $ROLE_ARN

echo "done!"
####

##
## END
##
echo "$(basename $0) deploy SUCCESS @ $(date)"