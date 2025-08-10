const path = require("path");
const fs = require("fs");
const zlib = require("zlib");

class LsTreeCommand {
  constructor(flag, commitSHA) {
    this.flag = flag;
    this.commitSHA = commitSHA;
  }

  execute() {
    const flag = this.flag;
    const commitSHA = this.commitSHA;

    const folder = commitSHA.slice(0, 2);
    const file = commitSHA.slice(2);

    const folderPath = path.join(process.cwd(), ".git", "objects", folder);
    const filePath = path.join(folderPath, file);

    if (!fs.existsSync(folderPath) || !fs.existsSync(filePath))
      throw new Error(`Not a valid object name ${commitSHA}`);

    const fileContents = fs.readFileSync(filePath);
    const outputBuffer = zlib.inflateSync(fileContents);
    const output = outputBuffer.toString().split("\0");

    const treeContent = output.slice(1).filter((e) => e.includes(" "));
    const names = treeContent.map((e) => e.split(" ")[1]);
    names.forEach((name) => {
      process.stdout.write(`${name}\n`);
    });
  }
}

module.exports = LsTreeCommand;
