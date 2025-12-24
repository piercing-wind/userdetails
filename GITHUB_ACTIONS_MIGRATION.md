# GitHub Actions Migration Guide

This guide explains how to migrate from AWS CodeBuild to GitHub Actions for your serverless pipeline.

## What Changed

1. **Removed from CloudFormation:**
   - CodeBuildRole
   - CodeBuildpolicy  
   - CodeBuildProject
   - Build stage from CodePipeline

2. **Modified CloudFormation:**
   - Updated pipeline source to use S3 instead of GitHub directly
   - Removed CodeBuild dependencies
   - Updated S3 bucket policy

3. **Added:**
   - GitHub Actions workflow (`.github/workflows/deploy.yml`)
   - IAM role for GitHub OIDC authentication (`stacks/github-actions-iam.yaml`)

## Setup Steps

### 1. Deploy the IAM Role for GitHub Actions

First, deploy the IAM role that will allow GitHub Actions to access your AWS resources:

```bash
aws cloudformation deploy \
  --template-file stacks/github-actions-iam.yaml \
  --stack-name <your-project-id>-github-actions-iam \
  --parameter-overrides \
    ProjectId=<your-project-id> \
    GithubOrg=<your-github-org> \
    GithubRepo=<your-github-repo> \
  --capabilities CAPABILITY_NAMED_IAM
```

### 2. Update Your Main Toolchain Stack

Deploy the updated toolchain without CodeBuild:

```bash
aws cloudformation deploy \
  --template-file tools/BASE_TOOLCHAIN/toolchain.yml \
  --stack-name <your-project-id>-toolchain \
  --parameter-overrides \
    ProjectId=<your-project-id> \
    Environment=<your-env> \
    GithubOrg=<your-github-org> \
    GithubRepo=<your-github-repo> \
    GithubConnectionUuid=<your-connection-uuid> \
  --capabilities CAPABILITY_NAMED_IAM
```

### 3. Configure GitHub Secrets

Add the following secret to your GitHub repository (Settings > Secrets and variables > Actions):

- `AWS_ROLE_TO_ASSUME`: The ARN of the IAM role created in step 1
  - Get this from the CloudFormation stack outputs or use:
    ```bash
    aws cloudformation describe-stacks \
      --stack-name <your-project-id>-github-actions-iam \
      --query 'Stacks[0].Outputs[?OutputKey==`GitHubActionsRoleArn`].OutputValue' \
      --output text
    ```

### 4. Update Environment Variables (if needed)

In the GitHub Actions workflow (`.github/workflows/deploy.yml`), update:

- `AWS_REGION`: Set to your preferred AWS region
- `PROJECT_ID`: Will automatically use your repository name

### 5. Test the Setup

1. Push code to the `main` branch
2. Check the Actions tab in your GitHub repository
3. Verify that:
   - GitHub Actions builds and packages your Lambda functions
   - Artifacts are uploaded to S3
   - CodePipeline execution is triggered
   - CloudFormation deployment completes successfully

## How It Works

1. **GitHub Actions Trigger**: Runs on pushes to `main` branch
2. **Build Process**: 
   - Installs Node.js dependencies
   - Packages CloudFormation templates using `aws cloudformation package`
   - Processes parameter files (replaces placeholders)
   - Creates deployment artifacts
3. **Upload to S3**: Uploads packaged artifacts to your pipeline's S3 bucket
4. **Trigger Pipeline**: Starts your existing CodePipeline which deploys via CloudFormation

## Benefits

- **No CodeBuild Quota**: GitHub Actions provides free build minutes
- **Faster Builds**: GitHub-hosted runners often start faster
- **Better Logging**: GitHub Actions provides cleaner, more detailed logs
- **Integrated**: Build logs are in the same place as your source code
- **Matrix Builds**: Easy to test against multiple Node.js versions if needed

## Troubleshooting

### Common Issues:

1. **Permission Errors**: Verify the IAM role has correct permissions and trust policy
2. **S3 Upload Fails**: Check that the S3 bucket exists and the role has access
3. **Pipeline Not Triggered**: Verify CodePipeline permissions and artifact location
4. **Template Packaging Fails**: Ensure your CloudFormation templates are valid

### Useful Commands:

```bash
# Check pipeline status
aws codepipeline get-pipeline-state --name <project-id>-Pipeline

# List S3 bucket contents
aws s3 ls s3://<project-id>-<region>-<account-id>-pipeline-artifacts/

# Check CloudFormation stack status
aws cloudformation describe-stacks --stack-name <project-id>-lambda
```

## Rollback Plan

If you need to rollback to CodeBuild:

1. Keep the original `toolchain.yml` file as backup
2. Redeploy the original CloudFormation stack
3. Remove the GitHub Actions workflow file
4. Delete the GitHub Actions IAM stack

The original buildspec.yml file is preserved and can be used again with CodeBuild if needed.