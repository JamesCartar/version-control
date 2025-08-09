const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const zlib = require("zlib");

class HashObjectCommand {
  constructor(flag, filePath) {
    this.flag = flag;
    this.filePath = filePath;
  }

  // Check -w flag included or not
  // if not
  //    { read the size of the file, then get the content of the file to construct [ blob <size>\0<content> ] then calculate the hash then output it}
  // else
  //    { read the size of the file, then get the content of the file to construct [ blob <size>\0<content> ] then calculate the bash, then write to .git/objects/hash[0,2]/hash[2,] }
  execute() {
    const flag = this.flag;
    const filePath = path.resolve(this.filePath);

    if (!fs.existsSync(filePath))
      throw new Error(
        `could not open '${this.filePath}' for reading: No such file or directory`
      );

    const content = fs.readFileSync(filePath);
    const header = `blob ${content.length}\0`;
    const blob = Buffer.concat([Buffer.from(header), content]);

    const hash = crypto.createHash("sha1").update(blob).digest("hex");

    if (flag && flag === "-w") {
      const folder = hash.slice(0, 2);
      const file = hash.slice(2);

      const completeFolderPath = path.join(
        process.cwd(),
        ".git",
        "objects",
        folder
      );

      if (!fs.existsSync(completeFolderPath)) fs.mkdirSync(completeFolderPath);

      const compressedData = zlib.deflateSync(blob);
      fs.writeFileSync(path.join(completeFolderPath, file), compressedData);
    }

    process.stdout.write(hash);
  }
}

module.exports = HashObjectCommand;
