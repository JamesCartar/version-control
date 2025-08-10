const fs = require("fs");
const path = require("path");

const GitClient = require("./git/commands/client");
const {
  CatFileCommand,
  HashObjectCommand,
  LsTreeCommand,
} = require("./git/commands");

const gitClient = new GitClient();

// Uncomment this block to pass the first stage
const command = process.argv[2];

switch (command) {
  case "init":
    createGitDirectory();
    break;
  case "cat-file":
    handleCatFileCommand();
    break;
  case "hash-object":
    handleHashObjectCommand();
    break;
  case "ls-tree":
    handleLsTreeCommand();
    break;
  default:
    throw new Error(`Unknown command ${command}`);
}
//
function createGitDirectory() {
  fs.mkdirSync(path.join(process.cwd(), ".git"), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), ".git", "objects"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(process.cwd(), ".git", "refs"), { recursive: true });

  fs.writeFileSync(
    path.join(process.cwd(), ".git", "HEAD"),
    "ref: refs/heads/main\n"
  );
  console.log("Initialized git directory");
}

function handleCatFileCommand() {
  const flag = process.argv[3];
  const commitSHA = process.argv[4];

  const command = new CatFileCommand(flag, commitSHA);
  gitClient.run(command);
}

function handleHashObjectCommand() {
  const flag = process.argv[4] ? process.argv[3] : null;
  const commitSHA = process.argv[4] ?? process.argv[3];

  const command = new HashObjectCommand(flag, commitSHA);
  gitClient.run(command);
}

function handleLsTreeCommand() {
  let flag = process.argv[3];
  let commitSHA = process.argv[4];

  if (flag && !commitSHA) return;

  if (!commitSHA && flag == "--name-only") return;

  if (!commitSHA) {
    commitSHA = flag;
    flag = null;
  }

  const command = new LsTreeCommand(flag, commitSHA);
  gitClient.run(command);
}
