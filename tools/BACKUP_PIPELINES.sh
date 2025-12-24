#!/bin/bash
#
# Backup AWS CodePipeline stacks
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


# sso login
if test "$1" == "SKIP_LOGIN"
then
    echo "$(basename $0) executing, skipping login..."
else
    echo "$(basename $0) executing, login..."
    aws sso login --profile $PROFILE
    check_error
fi


mkdir -p ../pipelines

#--# aws codepipeline get-pipeline --name="PIPELINE" > configuration_bkup/$PIPELINE.json  --profile=$toolsAccountProfile --region=us-east-1 


# echo "lamp-drupal-Pipeline
# lamp-drupal-Pipeline-EBEXTENSIONS
# lamp-drupal-Pipeline-WP-Ref-Arch
# lamp-drupal-Pipeline-decoupled" | while read pipeline_name




# echo "lamp-drupal-Pipeline
# lamp-drupal-Pipeline-app
# lamp-drupal-Pipeline-CDN-R53" | while read pipeline_name

#--# OVERRIDES
#--# export REGION="us-east-1"
#--# export PIPELINE_FULL_STACK="${NAMESPACE}-Pipeline"
#--# export PIPELINE_APP="${NAMESPACE}-Pipeline-app"
#--# export PIPELINE_CDN_R53="${NAMESPACE}-Pipeline-CDN-R53"



echo "PIPELINE_FULL-STACK

$PIPELINE_LAMBDAS" | while read pipeline_name
do

    mkdir -p ../pipelines

    export PIPELINE="$pipeline_name"
    echo "Backing up PIPELINE = $PIPELINE"
    aws codepipeline get-pipeline --name="$PIPELINE" --region=$REGION --profile $PROFILE > ../pipelines/${PIPELINE}.json
check_error

    echo "...sanitize account number in pipeline..."
    sed -i -e s/${ACCOUNT_NUMBER}/_REPLACE_ACCOUNT_NUMBER_/g ../pipelines/${PIPELINE}.json #--# linux
    #sed -e s/$ACCOUNT_NUMBER/_REPLACE_ACCOUNT_NUMBER_/g ../pipelines/${PIPELINE}.json #--# mac
    #--# sed s/$ACCOUNT_NUMBER/_REPLACE_ACCOUNT_NUMBER_/g ../pipelines/${PIPELINE}.json #--# mac
    check_error

    echo ; echo ;

    ## echo "Converting PIPELINE to yaml"
    ## json to yaml
    ## python -c 'import sys, yaml, json; yaml.safe_dump(json.load(sys.stdin),sys.stdout, default_flow_style=False)' < ../pipelines/${PIPELINE}.json > ../pipelines/${PIPELINE}.yaml    

    echo "done!
    ####

"

done

##
## END
##
echo "$(basename $0) deploy SUCCESS @ $(date)"