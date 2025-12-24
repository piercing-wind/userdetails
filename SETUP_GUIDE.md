## Usefull Files
.github\workflows
            |__ deploy.yml
params\dev
        |__ userdetails-parameters-lambdas.json
stack/lambdas_nodejs
  |        |_______ /getCounty   //everything inside
  |        |_______ /updateCounty // everything inside
  |
  |________ github-actions-iam.yaml
  |________ userdetails-lambdas.yaml


tools/BASE_TOOLCHAIN
  |       |_____ toolchain.yml
  |
  |_____________ create.sh  # Entry Point

.gitIgnore
build.conf
SETUP_GUIDE.md

## How to Setup
Before we follow these step you must have .git Installed on your PC

Step 1: Create new Repository on Github

- Repository name* = userdetails // Or anyvalue which u want
- Configurations =
        Visibility = Public
        ADD README = OFF
        ADD .gitIgnore = No .gitIgnore
        ADD Licence = no license
    
Click Create Repository

Step 2: 
    Open your terminal path\ServerlessPipeline
    RUN
    - git init 
    - git add .
    - git commit -m "Initial commit"

    git remote add origin https://github.com/YOUR-USERNAME/REPO-NAME.git
                    Github UserName   ______________|        |
                     Repository name  _______________________|
                                                
    git branch -M main
    git push -u origin main

Step 3:
    Open Terminal Again
    And run ./tools/create.sh

    You will see Output of an ARN similar to this

- `arn:aws:iam::851725398530:oidc-provider/token.actions.githubusercontent.com`

    Copy this ARN

    Next go to your github repository
    click on settings > secrets and variables > Actions
    click on New repository Secret

    Name = AWS_ROLE_TO_ASSUME
    Secret = arn:aws:iam::851725398530:oidc-provider/token.actions.githubusercontent.com

    Click on Add Secrets.

Step 4:
Open the build.conf on Editor

    Set/Change the variables:
    - REGION="us-east-1" 
    - DEV_PROFILE="default" //In my case its default change it according to yours
    - PROJECT_NAME="userdetails"  // MUST MATCH THE github repository Name
    - ORG_ID="github-userid"  // Your github-userid

    Thats all for build.conf

Next open:
**params/dev/userdetails-parameters-lambdas.json**

These are the parameter which we pass into the userdetails-lambdas.yml stack

Same logic logic here as previous if we are connecting to existing
DB in private VPC pass the vpcIds subnetIds securitygroupdsId. etc

And as per you info the DVsecrets already exist. so we need to pass the Secrets Manager ARN here.

Projectid: same as github repository name

Step 5:
Open the **.github\workflows\deploy.yml**

At line number 10 Make sure the region is same as in the build.conf

Next Open Terminal and RUN:

git add -A
git commit -m "Deploy"
git push origin main

Done..

Now It will create runner in Github Actions which you can check through
1. Go to your repository on GitHub.
2. Click on the "Actions" tab at the top.
3. You will see a list of recent workflow runs. Click on any run to view its details and logs.
4. To see runner details, click "Settings" > "Actions" > "Runners" in the left sidebar. Here you can view all runners associated with your repository.

Next Open AWS CodePipeline you can there Pipeline execution flow.

and in you stacks new stack will be created. which will create lambda function with api endpoint
Rest logic is same as the previously we were doing with Cloudformation stack.


## Note the above stepup is only one time
After the step you only need to change the Lambda code logic and run this 

git add -A
git commit -m "Deploy"
git push origin main

Lambda will be updated with new code.




## Permissions
AWS CLI User (running create.sh)

### Minimum permissions you need:

**IAM Permissions:**
- `iam:CreateOpenIDConnectProvider` - Create GitHub OIDC provider for keyless authentication
- `iam:ListOpenIDConnectProviders` - Check if OIDC provider already exists
- `iam:CreateRole` - Create CloudFormationTrustRole, CodePipelineTrustRole, GitHubActionsRole
- `iam:PutRolePolicy` - Attach inline policies to the roles
- `iam:AttachRolePolicy` - Attach AWS managed policies to roles
- `iam:GetRole` - Verify role creation and retrieve role details

**CloudFormation Permissions:**
- `cloudformation:CreateStack` - Deploy toolchain and GitHub Actions IAM stacks
- `cloudformation:UpdateStack` - Update stacks when configuration changes
- `cloudformation:DescribeStacks` - Check stack status and retrieve outputs
- `cloudformation:CreateChangeSet` - Preview changes before deployment
- `cloudformation:ExecuteChangeSet` - Apply the changes to the stack

**S3 Permissions:**
- `s3:CreateBucket` - Create artifact storage bucket for pipeline
- `s3:PutBucketPolicy` - Set bucket policy to allow access from pipeline roles

**CodePipeline Permissions:**
- `codepipeline:CreatePipeline` - Create the deployment pipeline

**Why needed:** One-time infrastructure setup. After running create.sh, these permissions are no longer used. The automated service roles (CloudFormation, CodePipeline, GitHub Actions) handle all subsequent operations.



## Resources We Create (via create.sh)

**OIDC Provider (line 47-51)**

Trust relationship between AWS and GitHub which
Allows GitHub Actions to assume an AWS role without storing AWS credentials

**GitHub Actions Stack for IAM Role (line 60-70)**

Creates: `userdetails-GitHubActions-Role`

**Permissions granted:** 
- `s3:PutObject` - Upload build artifacts to S3
- `codepipeline:StartPipelineExecution` - Trigger deployment pipeline
- `sts:GetCallerIdentity` - Verify AWS identity

See: `stacks/github-actions-iam.yaml` (lines 56-80)

**Usage:** GitHub Actions uses this role to upload packaged Lambda code and trigger deployments via codepipeline




**Toolchain Stack (line 75-83)**

Creates multiple resources via CloudFormation:

### 1. **S3 Bucket** 
Stores Lambda code zips, CloudFormation templates, and parameters

### 2. **CloudFormationTrustRole** 
**Used by:** AWS CloudFormation service

**Permissions granted:**
See: `tools/BASE_TOOLCHAIN/toolchain.yml` (lines 30-42)
- Creates Lambda functions, API Gateway, IAM roles, logs, VPC resources

**Usage:** During CodePipeline's "Deploy" stage, CloudFormation uses this role to create your Lambda/API resources

### 3. **CodePipelineTrustRole**
**Used by:** AWS CodePipeline service

**Permissions granted:**
See: `tools/BASE_TOOLCHAIN/toolchain.yml` (lines 70-95)
- Reads artifacts from S3, invokes CloudFormation deployment

**Usage:** When CodePipeline runs (triggered by GitHub Actions), it reads artifacts from S3 and tells CloudFormation to deploy

### 4. **CodePipeline**
The pipeline with 2 stages:
- **Source:** Monitors S3 for new artifacts
- **Deploy:** Creates and executes CloudFormation change set

## Runtime (after GitHub Actions pushes code)
Flow:
1. GitHub Actions (using GitHubActionsRole)
    Packages Lambda code
    Uploads to S3
    Triggers CodePipeline

2. CodePipeline (using CodePipelineTrustRole)
    Reads artifacts from S3
    Creates CloudFormation change set
    Tells CloudFormation to execute change set

3. CloudFormation (using CloudFormationTrustRole)
    Creates/updates Lambda function
    Creates/updates API Gateway
    Creates Lambda execution role

4. Lambda function (using LambdaExecutionRole - created by CloudFormation)
    Writes logs to CloudWatch
    (If configured) Reads from Secrets Manager
    (If configured) Runs in VPC