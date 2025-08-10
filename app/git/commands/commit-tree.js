const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const zlib = require("zlib");
const { updateRef } = require("../../utils/updateRef");

class CommitTreeCommand {
  constructor(treeSHA, commitSHA, message) {
    this.treeSHA = treeSHA;
    this.commitSHA = commitSHA;
    this.message = message;
  }

  execute() {
    const content = Buffer.concat([
      Buffer.from(`tree ${this.treeSHA}\n`),
      Buffer.from(`parent ${this.commitSHA}\n`),
      Buffer.from(
        `author Arjun Yadav <90121395+JamesCartar@users.noreply.github.com> ${Date.now()} +0000\n`
      ),
      Buffer.from(
        `committer Arjun Yadav <90121395+JamesCartar@users.noreply.github.com> ${Date.now()} +0000\n\n`
      ),
      Buffer.from(`${this.message}\n`),
    ]);

    const header = `commit ${content.length}\0`;
    const commit = Buffer.concat([Buffer.from(header), content]);

    const hash = crypto.createHash("sha1").update(commit).digest("hex");

    const folder = hash.slice(0, 2);
    const file = hash.slice(2);

    const completeFolderPath = path.join(
      process.cwd(),
      ".git",
      "objects",
      folder
    );

    if (!fs.existsSync(completeFolderPath)) fs.mkdirSync(completeFolderPath);

    const compressedData = zlib.deflateSync(commit);
    fs.writeFileSync(path.join(completeFolderPath, file), compressedData);

    process.stdout.write(hash);
  }
}

module.exports = CommitTreeCommand;
