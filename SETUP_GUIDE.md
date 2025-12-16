# UserDetails Serverless Pipeline - Complete Setup Guide

## 🎯 Overview

This guide walks you through setting up the complete AWS serverless pipeline for the UserDetails project, from scratch to deployment.

---

## 📋 Prerequisites

### 1. AWS Account Setup
- ✅ AWS Account: `050963339633` (DEV)
- ✅ AWS CLI installed and configured
- ✅ AWS SSO profile configured: `userdetailsdev`

### 2. GitHub Setup
- ✅ GitHub Organization: `AOC-ITO`
- ✅ GitHub Repository: `userdetails`
- ✅ Code pushed to `master` branch

### 3. Local Tools
- ✅ PowerShell 5.1+ (Windows)
- ✅ Git
- ✅ Node.js 20+ (for local testing)

---

## 🚀 STEP-BY-STEP SETUP

### **STEP 1: Configure AWS SSO Login**

```powershell
# Login to AWS
aws sso login --profile userdetailsdev

# Verify you're logged in
aws sts get-caller-identity --profile userdetailsdev
```

**Expected output:**
```json
{
    "UserId": "...",
    "Account": "050963339633",
    "Arn": "arn:aws:sts::050963339633:assumed-role/..."
}
```

---

### **STEP 2: Create S3 Artifact Bucket**

This bucket stores your build artifacts (packaged Lambda code).

```powershell
$BUCKET_NAME = "userdetails-050963339633-pipe"
$REGION = "us-east-1"
$PROFILE = "userdetailsdev"

# Create the bucket
aws s3api create-bucket `
    --bucket $BUCKET_NAME `
    --region $REGION `
    --profile $PROFILE

# Wait for bucket to be ready
aws s3api wait bucket-exists `
    --bucket $BUCKET_NAME `
    --region $REGION `
    --profile $PROFILE

Write-Host "✅ S3 bucket created: $BUCKET_NAME" -ForegroundColor Green
```

---

### **STEP 3: Create GitHub Connection**

AWS needs permission to access your GitHub repo.

**Via AWS Console:**
1. Go to: https://console.aws.amazon.com/codesuite/settings/connections
2. Click **"Create connection"**
3. Select **"GitHub"**
4. Connection name: `userdetails-github-connection`
5. Click **"Connect to GitHub"**
6. Authorize AWS in GitHub
7. Select organization: `AOC-ITO`
8. **Copy the Connection ARN** - looks like:
   ```
   arn:aws:codeconnections:us-east-1:050963339633:connection/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
   ```

**Update `build.conf`:**
```bash
# Extract just the UUID from the ARN
DEV_GITHUB_CONN_UUID="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
```

---

### **STEP 4: Deploy Toolchain Infrastructure**

The toolchain creates IAM roles, CodeBuild projects, and permissions.

```powershell
cd C:\Users\piercingwire\Documents\Clients\Ganesh\ServerlessPipeline

# Deploy the toolchain stack
aws cloudformation create-stack `
    --stack-name userdetails-toolchain `
    --template-body file://tools/BASE_TOOLCHAIN/toolchain.yml `
    --parameters `
        ParameterKey=ProjectId,ParameterValue=userdetails `
        ParameterKey=ReleasesS3Bucket,ParameterValue=userdetails-050963339633-pipe `
        ParameterKey=Environment,ParameterValue=dev `
        ParameterKey=GithubOrg,ParameterValue=AOC-ITO `
        ParameterKey=GithubRepo,ParameterValue=userdetails `
    --capabilities CAPABILITY_NAMED_IAM `
    --region us-east-1 `
    --profile userdetailsdev

Write-Host "⏳ Waiting for toolchain stack to complete..." -ForegroundColor Yellow

# Wait for stack creation to complete (takes 2-5 minutes)
aws cloudformation wait stack-create-complete `
    --stack-name userdetails-toolchain `
    --region us-east-1 `
    --profile userdetailsdev

Write-Host "✅ Toolchain stack deployed successfully!" -ForegroundColor Green
```

**What this creates:**
- ✅ IAM Role: `userdetails-Toolchain` (for CodePipeline)
- ✅ IAM Role: `userdetails-CloudFormation` (for deploying Lambdas)
- ✅ IAM Role: `CodeStarWorker-userdetails-CodeBuild` (for building code)
- ✅ CodeBuild Project: `userdetails` (main build)
- ✅ CodeBuild Project: `userdetails-Magic` (optional CloudFront setup)

---

### **STEP 5: Create the Pipeline**

Now create the actual CI/CD pipeline.

```bash
cd tools

# This script will:
# 1. Replace placeholders in the pipeline JSON
# 2. Create the pipeline in AWS

./CREATE_BASE_PIPELINES_DEV_GITHUB.sh
```

**What happens:**
1. Script reads `build.conf` for account numbers, GitHub connection UUID
2. Updates `../pipelines/userdetails-Pipeline-LAMBDAS.json` with real values
3. Calls `aws codepipeline create-pipeline`
4. Pipeline is now live in AWS!

**Expected output:**
```
Create PIPELINE = userdetails-Pipeline-LAMBDAS
Pipeline created successfully!
```

---

### **STEP 6: Push Lambda Code to GitHub**

```powershell
cd C:\Users\piercingwire\Documents\Clients\Ganesh\ServerlessPipeline

# Check status
git status

# Add the new Lambda files
git add stacks/lambdas_nodejs/

# Commit
git commit -m "Add Lambda function source code for getCounty and updateCounty"

# Push to GitHub (triggers the pipeline!)
git push origin master
```

---

### **STEP 7: Monitor Pipeline Execution**

**Via AWS Console:**
1. Go to: https://console.aws.amazon.com/codesuite/codepipeline/pipelines
2. Click on: `userdetails-Pipeline-LAMBDAS`
3. Watch the stages execute:

**Pipeline Flow:**
```
┌─────────────────────────────────────────────┐
│ 1. Source (GitHub)                          │
│    ✅ Pull code from GitHub master branch   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. Manual Approval (Build)                  │
│    ⏸️  Waiting for you to approve           │
└─────────────────────────────────────────────┘
                    ↓ (Click "Review" → "Approve")
┌─────────────────────────────────────────────┐
│ 3. Build (CodeBuild)                        │
│    - npm install in getCounty/              │
│    - npm install in updateCounty/           │
│    - Package CloudFormation templates       │
│    - Upload to S3                           │
│    ✅ Creates userdetails-lambdas-export.yml│
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 4. Manual Approval (Deploy)                 │
│    ⏸️  Waiting for you to approve           │
└─────────────────────────────────────────────┘
                    ↓ (Click "Review" → "Approve")
┌─────────────────────────────────────────────┐
│ 5. Deploy-Lambdas (CloudFormation)          │
│    - Create CloudFormation ChangeSet        │
│    - Execute ChangeSet                      │
│    ✅ Deploys:                              │
│       - Private API Gateway                 │
│       - getCounty Lambda (11 endpoints)     │
│       - updateCounty Lambda (2 endpoints)   │
│       - userdetailsvpcTest Lambda           │
│       - IAM Roles                           │
│       - SNS Topic                           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 6. Deploy-Lambdas-Observability (optional)  │
│    ✅ CloudWatch Alarms                     │
└─────────────────────────────────────────────┘
```

**Via AWS CLI:**
```powershell
# Check pipeline status
aws codepipeline get-pipeline-state `
    --name userdetails-Pipeline-LAMBDAS `
    --region us-east-1 `
    --profile userdetailsdev
```

---

### **STEP 8: Approve Pipeline Stages**

When pipeline reaches manual approval stages:

**Option 1: AWS Console**
1. Click **"Review"** button
2. Add optional comment: "Approved for deployment"
3. Click **"Approve"**

**Option 2: AWS CLI**
```powershell
aws codepipeline put-approval-result `
    --pipeline-name userdetails-Pipeline-LAMBDAS `
    --stage-name APPROVAL_STEP_BUILD `
    --action-name approveDeploy `
    --result status=Approved,summary="Approved via CLI" `
    --token <PASTE_TOKEN_FROM_CONSOLE> `
    --region us-east-1 `
    --profile userdetailsdev
```

---

### **STEP 9: Get API Gateway URL**

Once deployment completes:

```powershell
# Get the API Gateway ID
$API_ID = aws cloudformation describe-stacks `
    --stack-name userdetails-Lambdas `
    --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayApiEndpoint'].OutputValue" `
    --output text `
    --region us-east-1 `
    --profile userdetailsdev

Write-Host "✅ API Gateway URL: $API_ID" -ForegroundColor Green

# Or get from SSM Parameter
aws ssm get-parameter `
    --name /userdetails/dev/api-gateway/ApiGatewayApiURL `
    --query "Parameter.Value" `
    --output text `
    --region us-east-1 `
    --profile userdetailsdev
```

---

### **STEP 10: Get API Key**

Your API requires an API key for authentication:

```powershell
# Get the API Key ID
$API_KEY_ID = aws apigateway get-api-keys `
    --query "items[?name=='userdetailsvpcApiGatewayKey'].id" `
    --output text `
    --region us-east-1 `
    --profile userdetailsdev

# Get the actual API key value
$API_KEY_VALUE = aws apigateway get-api-key `
    --api-key $API_KEY_ID `
    --include-value `
    --query "value" `
    --output text `
    --region us-east-1 `
    --profile userdetailsdev

Write-Host "✅ API Key: $API_KEY_VALUE" -ForegroundColor Green
```

**⚠️ IMPORTANT:** This is a **private API** - only accessible from within the VPC!

---

### **STEP 11: Test Your API**

Since this is a private API (VPC endpoint only), you need to test from within the VPC:

**Option A: From EC2 instance in same VPC**
```bash
curl -X GET \
  "https://<API-ID>-<VPC-ENDPOINT-ID>.execute-api.us-east-1.amazonaws.com/vpcapi/getCountyByApp?app=testapp" \
  -H "x-api-key: YOUR_API_KEY_HERE"
```

**Option B: Invoke Lambda directly (for testing)**
```powershell
# Test getCounty Lambda
aws lambda invoke `
    --function-name userdetails-dev-lambda-getCounty `
    --payload '{\"path\":\"/getCountyByApp\",\"httpMethod\":\"GET\",\"queryStringParameters\":{\"app\":\"testapp\"}}' `
    --region us-east-1 `
    --profile userdetailsdev `
    response.json

# View the response
Get-Content response.json | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Expected Response:**
```json
{
    "statusCode": 200,
    "headers": {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
    },
    "body": "{\"message\":\"getCountyByApp\",\"app\":\"testapp\",\"data\":[]}"
}
```

---

## 🔄 HOW IT ALL WORKS TOGETHER

### **The Complete Flow:**

```
1. DEVELOPER
   └─> Pushes code to GitHub (master branch)
        │
        ↓
2. GITHUB
   └─> Sends webhook to AWS CodePipeline
        │
        ↓
3. CODEPIPELINE (Source Stage)
   └─> Downloads code from GitHub
   └─> Creates artifact: userdetails-SourceArtifact.zip
   └─> Stores in S3: s3://userdetails-050963339633-pipe/
        │
        ↓
4. MANUAL APPROVAL (Build Gate)
   └─> Human approves/rejects
        │
        ↓
5. CODEBUILD (Build Stage)
   └─> Reads: buildspec.yml
   └─> Executes:
       ├─> npm install in stacks/lambdas_nodejs/getCounty/
       ├─> npm install in stacks/lambdas_nodejs/updateCounty/
       ├─> aws cloudformation package --template stacks/userdetails-lambdas.yaml
       └─> Uploads Lambda .zip files to S3
   └─> Creates artifact: userdetails-BuildArtifact.zip
       ├─> Contains: userdetails-lambdas-export.yml (with S3 references)
       └─> Contains: params/dev/userdetails-parameters-lambdas.json
        │
        ↓
6. MANUAL APPROVAL (Deploy Gate)
   └─> Human approves/rejects
        │
        ↓
7. CLOUDFORMATION (Deploy Stage - Part 1)
   └─> Action: LambdasGenerateChangeSet
   └─> Reads: userdetails-lambdas-export.yml
   └─> Reads: params/dev/userdetails-parameters-lambdas.json
   └─> Creates CloudFormation ChangeSet
   └─> Shows: What will be created/updated/deleted
        │
        ↓
8. CLOUDFORMATION (Deploy Stage - Part 2)
   └─> Action: LambdasExecuteChangeSet
   └─> Executes the ChangeSet
   └─> Creates/Updates:
       ├─> API Gateway (Private, VPC endpoint)
       ├─> API Gateway API Key
       ├─> API Gateway Usage Plan (rate limiting)
       ├─> Lambda: getCounty (with 11 API routes)
       ├─> Lambda: updateCounty (with 2 API routes)
       ├─> Lambda: userdetailsvpcTest
       ├─> IAM Role: LambdaExecutionRole (with VPC, Lambda invoke, DynamoDB permissions)
       ├─> SNS Topic: ObservabilityEmailAlarmSnsTopic
       └─> SSM Parameters: /userdetails/dev/api-gateway/ApiGatewayApiURL, etc.
        │
        ↓
9. CLOUDFORMATION (Observability - Optional)
   └─> Deploys CloudWatch Alarms for Lambda monitoring
        │
        ↓
10. API GATEWAY
    └─> Now accepting requests at:
        https://<API-ID>-<VPC-ENDPOINT>.execute-api.us-east-1.amazonaws.com/vpcapi/
        │
        ↓
11. END USER (from within VPC)
    └─> Calls API with x-api-key header
         │
         ↓
12. API GATEWAY
    └─> Validates API key
    └─> Routes to correct Lambda based on path
         │
         ↓
13. LAMBDA FUNCTION (getCounty or updateCounty)
    └─> Executes handler function
    └─> May invoke other Lambdas (entdatavpc-dev-lambda-getdata)
    └─> Returns response
         │
         ↓
14. API GATEWAY
    └─> Returns response to caller with CORS headers
```

---

## 🔍 KEY CONCEPTS EXPLAINED

### **1. Why Two Build Artifacts?**
- **SourceArtifact**: Raw code from GitHub (before build)
- **BuildArtifact**: Compiled/packaged code (after `npm install`, with dependencies)

### **2. Why Manual Approvals?**
- **Safety gates** - prevents accidental deployments
- **Review opportunity** - check what changed before deploying
- **Production best practice** - especially important for prod environments

### **3. Why CloudFormation ChangeSets?**
- **Preview changes** before applying them
- **See exactly** what will be created/modified/deleted
- **Rollback capability** if something goes wrong

### **4. What is "Packaged" Template?**
Original template:
```yaml
CodeUri: ./lambdas_nodejs/getCounty
```

Packaged template (after `aws cloudformation package`):
```yaml
CodeUri: s3://userdetails-050963339633-pipe/abc123def456.zip
```

Lambda code gets zipped and uploaded to S3, CloudFormation references the S3 location.

### **5. Why VPC Endpoint?**
- **Private API** - not accessible from internet
- **Security** - only accessible from within your VPC
- **Compliance** - keeps sensitive data internal

---

## 📊 MONITORING & TROUBLESHOOTING

### **Check Pipeline Status**
```powershell
aws codepipeline get-pipeline-state `
    --name userdetails-Pipeline-LAMBDAS `
    --profile userdetailsdev
```

### **Check CodeBuild Logs**
```powershell
# Get recent build
$BUILD_ID = aws codebuild list-builds-for-project `
    --project-name userdetails `
    --query "ids[0]" `
    --output text `
    --profile userdetailsdev

# View logs
aws codebuild batch-get-builds `
    --ids $BUILD_ID `
    --query "builds[0].logs.deepLink" `
    --output text `
    --profile userdetailsdev
```

### **Check Lambda Logs**
```powershell
# Get log streams for getCounty Lambda
aws logs tail /aws/lambda/userdetails-dev-lambda-getCounty `
    --follow `
    --profile userdetailsdev
```

### **Check CloudFormation Stack**
```powershell
aws cloudformation describe-stacks `
    --stack-name userdetails-Lambdas `
    --profile userdetailsdev
```

### **Common Issues**

**Issue 1: "Access Denied" during deployment**
- Check IAM roles have correct permissions
- Verify PermissionsBoundary is set correctly

**Issue 2: "npm install" fails in CodeBuild**
- Check package.json is valid
- Verify Node.js version in buildspec.yml matches runtime

**Issue 3: API returns 403 Forbidden**
- Check x-api-key header is included
- Verify API key is valid
- Confirm request is coming from within VPC (private API)

**Issue 4: Lambda timeout**
- Check VPC security groups allow outbound traffic
- Verify NAT Gateway exists (if Lambda needs internet)
- Increase timeout in userdetails-lambdas.yaml

---

## 🎉 SUCCESS CRITERIA

You've successfully deployed when:

✅ Pipeline shows all stages as "Succeeded"  
✅ CloudFormation stack `userdetails-Lambdas` is "CREATE_COMPLETE"  
✅ Lambda functions exist and can be invoked  
✅ API Gateway returns 200 OK responses  
✅ CloudWatch logs show function execution  

---

## 🔄 UPDATING THE PIPELINE

When you make changes to code:

```bash
# 1. Make changes locally
# 2. Test locally (optional)
# 3. Commit and push
git add .
git commit -m "Update Lambda function logic"
git push origin master

# 4. Pipeline auto-triggers
# 5. Approve build stage
# 6. Approve deploy stage
# 7. Changes are live!
```

When you make changes to pipeline structure:

```bash
cd tools

# Edit the pipeline JSON
nano ../pipelines/userdetails-Pipeline-LAMBDAS.json

# Update the pipeline
./UPDATE_PIPELINES_DEV.sh
```

---

## 📚 NEXT STEPS

1. **Add Real Business Logic** - Replace mock responses in Lambda functions
2. **Add Tests** - Unit tests for Lambda functions
3. **Add Observability** - Deploy the observability stack
4. **Add QA Environment** - Create QA pipeline using QA scripts
5. **Add Production** - Create Prod pipeline with stricter approvals
6. **Add CI/CD for Infrastructure** - Version control for CloudFormation templates

---

## 🆘 NEED HELP?

**AWS Resources:**
- CodePipeline: https://console.aws.amazon.com/codesuite/codepipeline/pipelines
- CloudFormation: https://console.aws.amazon.com/cloudformation/home
- Lambda: https://console.aws.amazon.com/lambda/home
- API Gateway: https://console.aws.amazon.com/apigateway/main/apis

**Documentation:**
- AWS CodePipeline: https://docs.aws.amazon.com/codepipeline/
- AWS Lambda: https://docs.aws.amazon.com/lambda/
- API Gateway: https://docs.aws.amazon.com/apigateway/
- CloudFormation: https://docs.aws.amazon.com/cloudformation/

---

**Last Updated:** December 16, 2025  
**Version:** 1.0  
**Author:** Setup automation script
