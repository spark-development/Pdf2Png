const tmp = require("tmp");
const fs = require("fs");
const gs = require("gs");
const filesource = require("filesource");

let initialized = false;

// Add Ghostscript executables path
let projectPath = __dirname.split("\\");
projectPath.pop();
projectPath = projectPath.join("\\");

exports.ghostscriptPath = `${projectPath}\\executables\\ghostScript`;

// for linux compability
exports.ghostscriptPath = exports.ghostscriptPath.split("\\").join("/");

exports.convert = function convertFile(...args) {
  const [ filepathOrData ] = args;
  let [ , callback, options ] = args;

  if (options !== null) {
    [ , options, callback ] = args;
  }

  if (!initialized) {
    if (!options.useLocalGhostscript) {
      process.env.Path += `;${exports.ghostscriptPath}`;
    }

    initialized = true;
  }

  options.quality = options.quality || 100;

  filesource.getDataPath(filepathOrData, (resp) => {
    if (!resp.success) {
      callback(resp);
      return;
    }

    // get temporary filepath
    tmp.file({ postfix: ".png" }, (err, imageFilepath, fd) => {
      if (err) {
        callback({ success: false, error: `Error getting second temporary filepath: ${err}` });
        return;
      }

      gs()
        .batch()
        .nopause()
        .executablePath("ghostscript/bin/./gs")
        .option("-dQUIET")
        .option("-dPARANOIDSAFER")
        .option("-dNOPROMPT")
        .device("png16m")
        .option("-dTextAlphaBits=4")
        .option("-dGraphicsAlphaBits=4")
        .option(`-r${options.quality}`)
        .output(imageFilepath)
        .input(resp.data)
        .option("-dFirstPage=1")
        .option("-dLastPage=1")
        .exec((error, stdout, stderr) => {
          // Remove temp files
          resp.clean();

          if (error !== null) {
            callback({ success: false, error: `Error converting pdf to png: ${error}` });
            return;
          }

          if (options.returnFilePath) {
            callback({ success: true, data: imageFilepath });
            return;
          }

          const img = fs.readFileSync(imageFilepath);

          // Remove temp file
          fs.unlinkSync(imageFilepath);

          callback({ success: true, data: img });
        });
    });
  });
};
