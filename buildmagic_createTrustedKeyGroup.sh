#!/bin/bash


function check_error(){
if test $? -gt 0
then
    echo "$(basename $0) deploy failed @ $(date) ..."
    exit 1
fi
}






source build.conf
    check_error

export ENVIRONMENT=`echo "$ENVIRONMENT" | tr -s [:lower:] [:upper:]`  
export CURRENT_ENV=$ENVIRONMENT

if test "$CURRENT_ENV" == "DEV"
then
    export ACCOUNT_NUMBER=$DEV_ACCOUNT_NUMBER
    export PROFILE=$DEV_PROFILE
elif test "$CURRENT_ENV" == "QA"
then
    export ACCOUNT_NUMBER=$QA_ACCOUNT_NUMBER
    export PROFILE=$QA_PROFILE
elif test "$CURRENT_ENV" == "PROD"
then
    export ACCOUNT_NUMBER=$PROD_ACCOUNT_NUMBER
    export PROFILE=$PROD_PROFILE
else
    echo "ERROR CURRENT_ENV"
    exit 1
fi

if test "$1" == "SKIP_LOGIN"
then
    echo "$(basename $0) executing, skipping login..."
else
    echo "$(basename $0) executing sso login..."
    aws sso login --profile $PROFILE
    check_error
fi

#######################

openssl genrsa -out private_key.pem 2048

openssl rsa -pubout -in private_key.pem -out public_key.pem

# You must specify a region.You can also configure your region by running " aws configure"
# must do this, otherwise commandrunner will fail on waitcondition
mkdir -p ~/.aws/
echo '[default]' > ~/.aws/config
echo 'region = us-east-1' >> ~/.aws/config

# Upload public key to SSM Parameter Store using the dynamic path

aws ssm put-parameter --name "$PublicKeyPath" --value "$(cat public_key.pem)" --type "String" --overwrite
    check_error

# Check if the secret exists
if aws secretsmamager describe-secret --secret-id "$PrivateKeySecretArn" >/dev/null 
    then
        # If the secret exists, delete it first
        echo "Secret $PrivateKeyName exista. Deleting..."
        aws secretsmamager delete-secret --secret-id "$PrivateKeyName" --force-delete-without-recovery
            check_error
fi

#Wait for the cool-down period
while aws secretsmanager describe-secret --secret-id "$PrivateKeyName" >/dev/null; do
    echo "Waiting for cool-down period to complete..."
    echo "sleep 10 seconds to allow secret to be deleted"
    sleep 10
done

# Create the new secret
# Upload private key to Secrets Manager
aws secretsmanager create-secret --name "$PrivateKeyName" --secret-string "$(cat private_key.pem)"
    check_error

echo "Secret $PrivateKeyName created/overwritten successfully."

# remove temporary key files
rm -f private_key.pem public_key.pem