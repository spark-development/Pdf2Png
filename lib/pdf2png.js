const fs = require("fs");
const path = require("path");
const os = require("os");
const randomString = require("randomstring");

const gs = require("./gs");

let initialized = false;

// Add Ghostscript executables path
let projectPath = __dirname.split("\\");
projectPath.pop();
projectPath = projectPath.join("\\");

exports.ghostscriptPath = `${projectPath}\\executables\\ghostScript`;

// for linux compability
exports.ghostscriptPath = exports.ghostscriptPath.split("\\").join("/");

const defaultOptions = { useLocalGhostscript: true };

exports.convert = function convertFile(filePath, options) {
  return new Promise((resolve, reject) => {
    options = { ...defaultOptions, ...options };

    if (!initialized) {
      if (!options.useLocalGhostscript) {
        process.env.PATH += `${path.delimiter}${path.resolve(exports.ghostscriptPath)}`;
      }

      initialized = true;
    }

    options.quality = options.quality || 100;

    const tmpFile = path.join(os.tmpdir(), `${randomString.generate(16)}.png`);

    gs()
      .batch()
      .nopause()
      .option("-dQUIET")
      .option("-dPARANOIDSAFER")
      .option("-dNOPROMPT")
      .device("png16m")
      .option("-dTextAlphaBits=4")
      .option("-dGraphicsAlphaBits=4")
      .option(`-r${options.quality}`)
      .output(tmpFile)
      .input(filePath)
      .option("-dFirstPage=1")
      .option("-dLastPage=1")
      .exec()
      .then(() => {
        if (options.returnFilePath) {
          resolve(tmpFile);
          return;
        }

        const img = fs.readFileSync(tmpFile);
        fs.unlinkSync(tmpFile);
        resolve(img);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
