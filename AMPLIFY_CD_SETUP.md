# Amplify CD Visibility Setup

This repo's frontend workflow includes an `Amplify deployment` job that runs after CI passes on pushes to `main`. The job waits for the AWS Amplify deployment for the same commit and reports success or failure in GitHub Actions.

## Required GitHub Variables

Set these in GitHub under repository **Settings** -> **Secrets and variables** -> **Actions** -> **Variables**.

- `AWS_REGION`: the AWS region for the Amplify app, for example `us-west-1`.
- `AWS_ROLE_TO_ASSUME`: the ARN of the IAM role GitHub Actions can assume.
- `AMPLIFY_APP_ID`: the Amplify app ID.

## AWS IAM Permissions

The assumed role needs read-only access to the target Amplify app's job status:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "amplify:GetJob",
        "amplify:ListJobs"
      ],
      "Resource": "*"
    }
  ]
}
```

You can scope `Resource` more tightly later once the app ARN is confirmed.

## AWS Trust Policy

Configure the role to trust GitHub's OIDC provider and this repository. Replace `OWNER` and `REPO` with the GitHub owner and repository name.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:OWNER/REPO:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

## Notes

- This job does not trigger the deployment. Amplify still deploys from its GitHub integration.
- This job watches AWS Amplify and surfaces the deploy result in GitHub Actions.
- The job only runs for pushes to `main`, not pull requests.
