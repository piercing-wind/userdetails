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


echo "Create CODESTAR PROJECT = ${CODESTAR_PROJECT_NAME}"


# TODO: create releases bucket if not exists
#aws s3api head-bucket \
#    --bucket ${RELEASES_BUCKET} --region=$REGION -- profile $PROFILE
if aws s3api head-bucket \
    --bucket ${RELEASES_BUCKET} --region=$REGION --profile $PROFILE 2>/dev/null
then
    echo "Releases bucket exists :: ${RELEASES_BUCKET}"
else
    echo "releases bucket does NOT exist...creating bucket :: ${RELEASES_BUCKET}"
    aws s3api create-bucket --bucket ${RELEASES_BUCKET} --region=${REGION} --profile $PROFILE
    check_error

    echo "waiting till bucket get's created..."
aws s3api wait bucket-exists \
    --bucket ${RELEASES_BUCKET} --region=$REGION --profile $PROFILE
    check_error
  echo "releases bucket created cuccessfully "

fi

echo "...upload codestar src & toolchain to s3..."
# aws s3 cp src.zip s3://MyBucket/src.zip
# aws s3 cp toolchain.yml s3://MyBucket/toolchain.yml
aws s3 cp ../CODESTAR_SRC/${CODESTAR_PROJECT_NAME}_src.zip s3://${RELEASES_BUCKET}/${CODESTAR_PROJECT_NAME}_src.zip --profile $PROFILE
    check_error

#### https://docs.aws.amazon.com/codestar/latest/userguide/cli-tutorial.html

#aws codestar create-project --generate-cli-skeleton

# aws codestar create-projecct --cli-input-json gile://input.json

aws codestar create-project --cli-input-json file://CODESTAR_BASE_TOOLCHAIN/codestar_skel_${CODESTAR_PROJECT_NAME}.json --region=$REGION --profile $PROFILE
    check_error

    echo ; echo ;



    echo ; "done!
    #####

    "

##
## END
##
echo "$(basename $0) deploy SUCCESS @ $(date)"    