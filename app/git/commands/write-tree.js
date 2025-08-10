const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const zlib = require("zlib");

function writeFileBlob(currentPath) {
  const content = fs.readFileSync(currentPath);
  const length = content.length;

  const header = `blob ${length}\0`;
  const blob = Buffer.concat([Buffer.from(header), content]);

  const hash = crypto.createHash("sha1").update(blob).digest("hex");

  const folder = hash.slice(0, 2);
  const file = hash.slice(2);

  const completeFolderPath = path.join(
    process.cwd(),
    ".git",
    "objects",
    folder
  );

  fs.mkdirSync(completeFolderPath, { recursive: true });

  const objectFilePath = path.join(completeFolderPath, file);
  const compressedData = zlib.deflateSync(blob);

  if (fs.existsSync(objectFilePath)) {
    fs.chmodSync(objectFilePath, 0o644);
  }
  fs.writeFileSync(objectFilePath, compressedData);

  return hash;
}

class WriteTreeCommand {
  constructor() {}

  // 1. recursively read all files and directory
  // 2. if item is directory, do it again for inner directory
  // 3. if item is file, create blob, write hash and create file in objects folder and write the entry to tree
  // 4. write the tree in object folder and output tree commitSHA
  execute() {
    function recursivelyCreateTree(basePath) {
      const dirContents = fs.readdirSync(basePath, { withFileTypes: true });
      const result = [];

      for (const dirContent of dirContents) {
        const name = dirContent.name;
        if (name == ".git" || name === "node_modules") continue;

        const currentPath = path.join(basePath, name);
        const sts = fs.statSync(currentPath);
        if (sts.isDirectory()) {
          const commitSHA = recursivelyCreateTree(currentPath);
          if (commitSHA) {
            result.push({
              mode: "40000",
              basename: name,
              commitSHA,
            });
          }
        } else if (sts.isFile()) {
          const isExecutable = (sts.mode & 0o100) !== 0;
          const commitSHA = writeFileBlob(currentPath);
          result.push({
            mode: isExecutable ? "100755" : "100644",
            basename: name,
            commitSHA,
          });
        }
      }

      if (dirContents.length === 0 || result.length === 0) return 0;

      result.sort((a, b) =>
        Buffer.from(a.basename).compare(Buffer.from(b.basename))
      );

      const treeData = result.reduce((acc, curr) => {
        const { mode, basename, commitSHA } = curr;
        return Buffer.concat([
          acc,
          Buffer.from(`${mode} ${basename}\0`),
          Buffer.from(commitSHA, "hex"),
        ]);
      }, Buffer.alloc(0));

      const tree = Buffer.concat([
        Buffer.from(`tree ${treeData.length}\0`),
        treeData,
      ]);

      const hash = crypto.createHash("sha1").update(tree).digest("hex");

      const folder = hash.slice(0, 2);
      const file = hash.slice(2);

      const completeFolderPath = path.join(
        process.cwd(),
        ".git",
        "objects",
        folder
      );

      fs.mkdirSync(completeFolderPath, { recursive: true });

      const objectFilePath = path.join(completeFolderPath, file);

      const compressedData = zlib.deflateSync(tree);

      if (fs.existsSync(objectFilePath)) {
        fs.chmodSync(objectFilePath, 0o644);
      }
      fs.writeFileSync(objectFilePath, compressedData);

      return hash;
    }

    const commitSHA = recursivelyCreateTree(process.cwd());

    process.stdout.write(commitSHA + "\n");
  }
}

module.exports = WriteTreeCommand;
