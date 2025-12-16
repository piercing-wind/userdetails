#!/bin/bash
#
# Create Base AWS CodePipelines
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


if test "$1" == "SKIP_LOGIN"
then
    echo "$(basename $0) executing, skipping login..."
else
    echo "$(basename $0) executing, login..."
    aws sso login --profile $PROFILE
        check_error
fi

# mkdir -p ../pipelines

#--# aws codepipeline get-pipeline --name="$PIELINE" > configuration_bkup/$PIELINE.json --profile=$ToolsAccountProfile --region=us-east-1   


# echo "lamp-drupal-Pipeline
# lamp-drupal-Pipeline-EBEXTENSIONS
# lamp-drupal-Pipeline-WP-Ref-Arch
# lamp-drupal-Pipeline-decoupled" | while read pipeline_name


# echo "lamp"