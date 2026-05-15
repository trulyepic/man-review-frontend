import { execFileSync } from "node:child_process";

const appId = process.env.AMPLIFY_APP_ID;
const branchName = process.env.AMPLIFY_BRANCH_NAME || "main";
const commitId = process.env.GITHUB_SHA;
const timeoutMinutes = Number(process.env.AMPLIFY_DEPLOY_TIMEOUT_MINUTES || 30);
const pollSeconds = Number(process.env.AMPLIFY_DEPLOY_POLL_SECONDS || 20);

if (!appId) {
  throw new Error("AMPLIFY_APP_ID is required.");
}

if (!commitId) {
  throw new Error("GITHUB_SHA is required.");
}

const deadline = Date.now() + timeoutMinutes * 60 * 1000;
const shortSha = commitId.slice(0, 7);

function awsJson(args) {
  const output = execFileSync("aws", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  return JSON.parse(output);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getMatchingJob() {
  const result = awsJson([
    "amplify",
    "list-jobs",
    "--app-id",
    appId,
    "--branch-name",
    branchName,
    "--max-results",
    "25",
  ]);

  return result.jobSummaries?.find((job) => {
    const summaryCommitId = job.commitId || "";
    return summaryCommitId === commitId || summaryCommitId.startsWith(shortSha);
  });
}

function getJob(jobId) {
  const result = awsJson([
    "amplify",
    "get-job",
    "--app-id",
    appId,
    "--branch-name",
    branchName,
    "--job-id",
    jobId,
  ]);

  return result.job;
}

console.log(
  `Waiting for Amplify deploy for ${branchName}@${shortSha} in app ${appId}.`
);

let matchingJob;

while (Date.now() < deadline) {
  matchingJob = getMatchingJob();

  if (matchingJob) {
    console.log(`Found Amplify job ${matchingJob.jobId}.`);
    break;
  }

  console.log("Amplify job not visible yet. Waiting...");
  await sleep(pollSeconds * 1000);
}

if (!matchingJob) {
  throw new Error(
    `Timed out after ${timeoutMinutes} minutes waiting for Amplify job for ${shortSha}.`
  );
}

while (Date.now() < deadline) {
  const job = getJob(matchingJob.jobId);
  const status = job.summary?.status || matchingJob.status;
  console.log(`Amplify job ${matchingJob.jobId} status: ${status}`);

  if (status === "SUCCEED") {
    console.log("Amplify deployment completed successfully.");
    process.exit(0);
  }

  if (["FAILED", "CANCELLED"].includes(status)) {
    throw new Error(`Amplify deployment ended with status: ${status}`);
  }

  await sleep(pollSeconds * 1000);
}

throw new Error(
  `Timed out after ${timeoutMinutes} minutes waiting for Amplify job ${matchingJob.jobId} to finish.`
);
