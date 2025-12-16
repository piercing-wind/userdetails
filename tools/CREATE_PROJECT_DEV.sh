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


# Override with DEV
export PROFILE=$DEV_PROFILE
export ACCOUNT_NUMBER=$DEV_ACCOUNT_NUMBER
export RELEASES_BUCKET="${RELEASES_BUCKET/_REPLACE_ACCOUNT_NUMBER_/"$ACCOUNT_NUMBER"}"



##sso login
if test "$1" == "SKIP_LOGIN"
then
    echo "$(basename $0) executing, skipping login..."
else
    echo "$(basename $0) executing, login..."
    aws sso login --profile $PROFILE
      check_error
fi

echo "Create PROJECT= ${PROJECT_NAME}"


if aws s3api head-bucket --bucket "$RELEASES_BUCKET" --region=$REGION --profile $PROFILE 2>/dev/null;
then
  echo "releases bucket exists :: ${RELEASES_BUCKET}"
else
    echo "releases bucket does NOT exist...creating bucket :: ${RELEASES_BUCKET}"
    aws s3api create-bucket --bucket ${RELEASES_BUCKET} --region=${REGION} --profile $PROFILE
        check_error 

    echo "waiting till bucket get's created..."

    aws s3api wait bucket-exists \
        --bucket ${RELEASES_BUCKET} --region=$REGION --profile $PROFILE
            check_error
        echo "releases bucket created successfully "   

fi

    echo "...updating account number."
    sed -i -e s/_REPLACE_ACCOUNT_NUMBER_/"$ACCOUNT_NUMBER"/g BASE_TOOLCHAIN/project_dev.json
    check_error

    aws cloudformation deploy \
        --template-file BASE_TOOLCHAIN/toolchain.yml \
        --stack-name "${PROJECT_NAME}-dev \
        --parameter-overrides file://BASE_TOOLCHAIN/project_dev.json \
        --capabilities CAPABILITY_NAMED_IAM \
        --region=$REGION \
        --profile $PROFILE
    check_error

    echo "...sanitize back account number in project file after update..."
    sed -i -e s/$ACCOUNT_NUMBER/_REPLACE_ACCOUNT_NUMBER_/g BASE_TOOLCHAIN/project_dev.json
    check_error

   echo ; echo ;


   echo "done!
   ####

   "

##
## END
##
echo "$(basename $0) deploy SUCCESS @ $(date)"