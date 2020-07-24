const { spawn } = require("child_process");

function gs() {
  return {
    options: [],
    _input: null,
    batch() {
      this.options.push("-dBATCH");
      return this;
    },
    diskfonts() {
      this.options.push("-dDISKFONTS");
      return this;
    },
    nobind() {
      this.options.push("-dNOBIND");
      return this;
    },
    nocache() {
      this.options.push("-dNOCACHE");
      return this;
    },
    nodisplay() {
      this.options.push("-dNODISPLAY");
      return this;
    },
    nopause() {
      this.options.push("-dNOPAUSE");
      return this;
    },
    define(key, val) {
      this.options.push(`-d${key}${val ? `=${val}` : ""}`);
      return this;
    },
    device(dev) {
      dev = dev || "txtwrite";
      this.options.push(`-sDEVICE=${dev}`);
      return this;
    },
    input(file) {
      this._input = file;
      return this;
    },
    output(file) {
      file = file || "-";
      this.options.push(`-sOutputFile=${file}`);
      if (file === "-") return this.q();
      return this;
    },
    q() {
      this.options.push("-q");
      return this;
    },
    p() {
      this.options.push("-p");
      return this;
    },
    papersize(size) {
      this.options.push(`-sPAPERSIZE=${size}`);
      return this;
    },
    res(xres, yres) {
      this.options.push(`-r${xres}${yres ? `x${yres}` : ""}`);
      return this;
    },
    safer() {
      this.options.push("-dSAFER");
      return this;
    },
    option(value) {
      this.options.push(value);
      return this;
    },
    exec() {
      return new Promise((resolve, reject) => {
        if (!this._input) {
          reject(new Error("No input specified"));
          return;
        }

        const proc = spawn("gs", this.options.concat([ this._input ]));
        proc.stdin.on("error", (err) => {
          reject(err);
        });
        proc.stdout.on("error", (err) => {
          reject(err);
        });

        const _data = [];
        let totalBytes = 0;
        proc.stdout.on("data", (data) => {
          totalBytes += data.length;
          _data.push(data);
        });
        proc.on("close", () => {
          const buf = Buffer.concat(_data, totalBytes);

          return resolve(buf.toString());
        });
        process.on("exit", () => {
          proc.kill();
        });
      });
    }
  };
}

module.exports = gs;
