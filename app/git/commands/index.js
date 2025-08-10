const CatFileCommand = require("./cat-file");
const CommitTreeCommand = require("./commit-tree");
const HashObjectCommand = require("./hash-object");
const LsTreeCommand = require("./ls-tree");
const WriteTreeCommand = require("./write-tree");

module.exports = {
  CatFileCommand,
  HashObjectCommand,
  LsTreeCommand,
  WriteTreeCommand,
  CommitTreeCommand,
};
