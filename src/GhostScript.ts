import {spawn} from "child_process";
import NoInputFileException from "./Exceptions/NoInputFileException";

export default class GhostScript {
  private _options: string[] = [];
  private _input: string | null = null;

  public option(value: string): GhostScript {
    this._options.push(value);
    return this;
  }

  public batch(): GhostScript {
    this.option("-dBATCH");
    return this;
  }

  public diskFonts(): GhostScript {
    this.option("-dDISKFONTS");
    return this;
  }

  public noBind(): GhostScript {
    this.option("-dNOBIND");
    return this;
  }

  public noCache(): GhostScript {
    this.option("-dNOCACHE");
    return this;
  }

  public noDisplay(): GhostScript {
    this.option("-dNODISPLAY");
    return this;
  }

  public noPause(): GhostScript {
    this.option("-dNOPAUSE");
    return this;
  }

  public define(key: string, val: string): GhostScript {
    this.option(`-d${key}${val ? `=${val}` : ""}`);
    return this;
  }

  public device(dev: string): GhostScript {
    dev = dev || "txtwrite";
    this.option(`-sDEVICE=${dev}`);
    return this;
  }

  public q(): GhostScript {
    this.option("-q");
    return this;
  }

  public p(): GhostScript {
    this.option("-p");
    return this;
  }

  public paperSize(size: string | number): GhostScript {
    this.option(`-sPAPERSIZE=${size}`);
    return this;
  }

  public res(xRes: string | number, yRes: string | number): GhostScript {
    this.option(`-r${xRes}${yRes ? `x${yRes}` : ""}`);
    return this;
  }

  public safer(): GhostScript {
    this.option("-dSAFER");
    return this;
  }

  public input(file: string): GhostScript {
    this._input = file;
    return this;
  }

  public output(file: string): GhostScript {
    file = file || "-";
    this.option(`-sOutputFile=${file}`);
    if (file === "-") return this.q();
    return this;
  }

  public exec(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this._input) {
        reject(new NoInputFileException());
        return;
      }

      const proc = spawn("gs", this._options.concat([this._input]));

      proc.stdin.on("error", (err) => {
        reject(err);
      });
      proc.stdout.on("error", (err) => {
        reject(err);
      });

      const _data: Buffer[] = [];
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
}
