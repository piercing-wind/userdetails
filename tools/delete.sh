#!/bin/bash
#
# Delete AWS infrastructure in correct order
#

function check_error(){
if test $? -gt 0
then
    echo "Warning: $(basename $0) encountered an error but continuing..."
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
export ENV=$DEV_ENVIRONMENT

echo "$(basename $0) executing with profile: $PROFILE"
echo "Delete PROJECT= ${PROJECT_NAME}"
echo ""
echo "=========================================="
echo "STEP 1: Deleting Lambda stack..."
echo "=========================================="

aws cloudformation delete-stack \
    --stack-name "${PROJECT_NAME}-lambda" \
    --region=$REGION \
    --profile $PROFILE

if [ $? -eq 0 ]; then
    echo "Waiting for Lambda stack deletion to complete..."
    aws cloudformation wait stack-delete-complete \
        --stack-name "${PROJECT_NAME}-lambda" \
        --region=$REGION \
        --profile $PROFILE
    echo "✓ Lambda stack deleted successfully"
else
    echo "⚠ Lambda stack deletion failed or stack doesn't exist"
fi

echo ""
echo "=========================================="
echo "STEP 2: Deleting Toolchain stack..."
echo "=========================================="

aws cloudformation delete-stack \
    --stack-name "${PROJECT_NAME}-dev" \
    --region=$REGION \
    --profile $PROFILE

if [ $? -eq 0 ]; then
    echo "Waiting for Toolchain stack deletion to complete..."
    aws cloudformation wait stack-delete-complete \
        --stack-name "${PROJECT_NAME}-dev" \
        --region=$REGION \
        --profile $PROFILE
    echo "✓ Toolchain stack deleted successfully"
else
    echo "⚠ Toolchain stack deletion failed or stack doesn't exist"
fi

echo ""
echo "=========================================="
echo "STEP 3: Deleting GitHub Actions IAM stack..."
echo "=========================================="

aws cloudformation delete-stack \
    --stack-name "${PROJECT_NAME}-github-actions-iam" \
    --region=$REGION \
    --profile $PROFILE

if [ $? -eq 0 ]; then
    echo "Waiting for GitHub Actions IAM stack deletion to complete..."
    aws cloudformation wait stack-delete-complete \
        --stack-name "${PROJECT_NAME}-github-actions-iam" \
        --region=$REGION \
        --profile $PROFILE
    echo "✓ GitHub Actions IAM stack deleted successfully"
else
    echo "⚠ GitHub Actions IAM stack deletion failed or stack doesn't exist"
fi

echo ""
echo "=========================================="
echo "Cleanup complete!"
echo "=========================================="
echo ""
echo "Note: OIDC provider is preserved for GitHub Actions authentication"
echo ""

echo "done!"
##
## END
##
echo "$(basename $0) completed @ $(date)"