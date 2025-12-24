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


source ../build.conf
  check_error


echo "DEV" | while read CURRENT_ENV
do

if test "$CURRENT_ENV" == "DEV"
then
    export ACCOUNT_NUMBER=$DEV_ACCOUNT_NUMBER
    export PROFILE=$DEV_PROFILE
    export ENV=$DEV_ENVIRONMENT
    export GITHUB_CONN_UUID=$DEV_GITHUB_CONN_UUID

else test "$CURRENT_ENV" == "QA"
then
    export ACCOUNT_NUMBER=$QA_ACCOUNT_NUMBER
    export PROFILE=$QA_PROFILE
    export ENV=$QA_ENVIRONMENT
    export GITHUB_CONN_UUID=$QA_GITHUB_CONN_UUID

elif test "$CURRENT_ENV" == "PROD"    
then
    export ACCOUNT_NUMBER=$PROD_ACCOUNT_NUMBER
    export PROFILE=$PROD_PROFILE
    export ENV=$PROD_ENVIRONMENT
    export GITHUB_CONN_UUID=$PROD_GITHUB_CONN_UUID

else
    echo "ERROR CURRENT_ENV"
    exit 1
fi

##sso login
if test "$1" == "SKIP_LOGIN"
then
    echo "$(basename $0) executing, skipping login..."
else
    echo "$(basename $0) executing, login..."
    aws sso login --profile $
    
    
      check_error
fi

echo "$PIPELINE_FULL_STACK
$PIPELINE_LAMBDAS" | while read pipeline_name
do

    export PIPELINE="$pipeline_name"
    echo "Updating PIPELINE = $PIPELINE"


    echo "...replace placeholders with real values before updating pipeline..."

    if test $BUILD_SYSTEM == "MAC"
    then
    #MAC
    sed -i '' s/_REPLACE_ACCOUNT_NUMBER_/$ACCOUNT_NUMBER/g ../pipelines/${PIPELINE}.json #--# mac
    check_error
    sed -i '' s/_REPLACE_ENV_/$ENV/g ../pipelines/${PIPELINE}.json #--# mac
    check_error
    sed -i '' s/_REPLACE_GITHUB_CONN_UUID_/$GITHUB_CONN_UUID/g ../pipelines/${PIPELINE}.json #--# mac
    check_error
    sed -i '' s/_REPLACE_GITHUB_REPOID_/userdetails/g ../pipelines/${PIPELINE}.json #--# mac
    check_error
    sed -i '' s/_REPLACE_GITHUB_ORGID_/$ORG_ID/g ../pipelines/${PIPELINE}.json #--#mac
    check_error

    elif test $BUILD_SYSTEM == "sLINUX"
    then
    # LINUX
    sed -i -e s/_REPLACE_ACCOUNT_NUMBER_/$ACCOUNT_NUMBER/g ../pipelines/${PIPELINE}.json #--# linux
    check_error
    sed -i -e s/_REPLACE_ENV_/$ENV/g ../pipelines/${PIPELINE}.json #--# linux
    check_error
    sed -i -e s/_REPLACE_GITHUB_CONN_UUID_/$GITHUB_CONN_UUID/g ../pipelines/${PIPELINE}.json #--# linux
    check_error
    sed -i -e s/_REPLACE_GITHUB_REPOID_/userdetails/g ../pipelines/${PIPELINE}.json #--# linux
    check_error
    sed -i -e s/_REPLACE_GITHUB_ORGID_/$ORG_ID/g ../pipelines/${PIPELINE}.json #--# linux
    check_error

    fi

    aws codepipeline update-pipeline --cli-input-json file://../pipelines/${PIPELINE}.json --profile $PROFILE
    check_error

    echo "...sanitize back account number in pipeline file after update..."
    if test $BUILD_SYSTEM == "MAC"
    then

    # MAC
        if test $BUILD_SYSTEM == "MAC"
    then
    #MAC
    sed -i '' s/$ACCOUNT_NUMBER/_REPLACE-ACCOUNT_NUMBER_/g ../pipelines/${PIPELINE}.json #--# mac
    check_error
    sed -i '' s/_REPLACE_ENV_/$ENV/g ../pipelines/${PIPELINE}.json #--# mac
    check_error
    sed -i '' s/_REPLACE-GITHUB_CONN_UUID_/$GITHUB_CONN_UUID/g ../pipelines/${PIPELINE}.json #--# mac
    check_error
    sed -i '' s/_REPLACE_GITHUB_REPOID_/${CODESTAR_PROJECT_NAME}/g ../pipelines/${PIPELINE}.json #--# mac
    sed -i '' s/${ORG_ID}/_REPLACE_GITHUB_ORGID_/g ../pipelines/${PIPELINE}.json #--#mac
    check_error

    elif test $BUILD_SYSTEM == "LINUX"
    then
    # LINUX
    sed -i -e s/$ACCOUNT_NUMBER/_REPLACE_ACCOUNT_NUMBER_/g ../pipelines/${PIPELINE}.json #--# linux
    check_error
    sed -i -e s/$ENV/_REPLACE_ENV_/g ../pipelines/${PIPELINE}.json #--# mac
    check_error
    sed -i -e s/$GITHUB_CONN_UUID/_REPLACE_GITHUB_CONN_UUID_/g ../pipelines/${PIPELINE}.json #--# mac
    check_error
    sed -i -e s/${CODESTAR_PROJECT_NAME}/_REPLACE_GITHUB_REPOID_/g ../pipelines/${PIPELINE}.json #--# mac
    check_error
    sed -i -e s/${ORG_ID}/_REPLACE_GITHUB_ORGID_/g ../pipelines/${PIPELINE}.json #--# mac
    check_error

    fi

    echo "done!
    #####


    "

    done

    done

    ##
    ## END
    ##
    echo "$(basename $0) deploy SUCCESS @ $(date)"