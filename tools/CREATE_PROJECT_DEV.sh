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
export PROFILE=$DEV_PROFILE
export ACCOUNT_NUMBER=$DEV_ACCOUNT_NUMBER
export RELEASES_BUCKET="${RELEASES_BUCKET/_REPLACE_ACCOUNT_NUMBER_/"$ACCOUNT_NUMBER"}"
export ENV=$DEV_ENVIRONMENT
export GITHUB_CONN_UUID=$DEV_GITHUB_CONN_UUID

echo "$(basename $0) executing with profile: $PROFILE"

echo "Create PROJECT= ${PROJECT_NAME}"

    echo "Deploying CloudFormation stack..."
    aws cloudformation create-stack \
        --template-body file://tools/BASE_TOOLCHAIN/toolchain.yml \
        --stack-name "${PROJECT_NAME}-dev" \
        --parameters \
            ParameterKey=ProjectId,ParameterValue="${PROJECT_NAME}" \
            ParameterKey=Environment,ParameterValue="dev" \
            ParameterKey=GithubOrg,ParameterValue="${ORG_ID}" \
            ParameterKey=GithubRepo,ParameterValue="${PROJECT_NAME}" \
            ParameterKey=GithubConnectionUuid,ParameterValue="${DEV_GITHUB_CONN_UUID}" \
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

   echo ; echo ;


   echo "done!"
   ####

##
## END
##
echo "$(basename $0) deploy SUCCESS @ $(date)"