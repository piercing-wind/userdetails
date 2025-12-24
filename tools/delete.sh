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
echo "STEP 4: Deleting OIDC Provider..."
echo "=========================================="

OIDC_ARN=$(aws iam list-open-id-connect-providers --profile $PROFILE --output text 2>/dev/null | grep "token.actions.githubusercontent.com" | awk '{print $2}' || true)

if [ -n "$OIDC_ARN" ]; then
    echo "Found OIDC provider: $OIDC_ARN"
    aws iam delete-open-id-connect-provider \
        --open-id-connect-provider-arn "$OIDC_ARN" \
        --profile $PROFILE
    
    if [ $? -eq 0 ]; then
        echo "✓ OIDC provider deleted successfully"
    else
        echo "⚠ OIDC provider deletion failed"
    fi
else
    echo "⚠ OIDC provider not found or already deleted"
fi

echo ""
echo "=========================================="
echo "Cleanup complete!"
echo "=========================================="
echo ""

##
## END
##
echo "$(basename $0) completed @ $(date)"