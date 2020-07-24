import {tmpdir} from "os";
import * as path from "path";
import {generate} from "randomstring";
import GhostScript from "./GhostScript";

const projectPath = __dirname.split(path.delimiter);
projectPath.pop();

let initialized = false;

export interface IPDF2PNGOptions {
  ghostScriptPath: string,
  useLocalGhostScript: boolean,
  type: SupportedExtensions,
  bitmapColor: boolean,
  quality: number,
}

export enum SupportedExtensions {
  PNG = "png",
  JPG = "jpg",
  BMP = "bmp"
}

export const defaultConfiguration: IPDF2PNGOptions = {
  ghostScriptPath: path.join(...projectPath, "executables", "ghostScript"),
  useLocalGhostScript: true,
  type: SupportedExtensions.PNG,
  quality: 100,
  bitmapColor: false
}

export function getTemporaryFile(extension: SupportedExtensions | string = SupportedExtensions.PNG): string {
  if (!extension || extension === "") {
    extension = SupportedExtensions.PNG;
  }
  return path.join(tmpdir(), `${generate(16)}.${extension}`);
}

export function pdf2png(filePath: string, options: IPDF2PNGOptions = defaultConfiguration): Promise<string | Buffer> {
  return new Promise((resolve, reject) => {
    options = {...defaultConfiguration, ...options};

    if (!initialized) {
      if (!options.useLocalGhostScript) {
        process.env.PATH += `${path.delimiter}${path.resolve(options.ghostScriptPath)}`;
      }

      initialized = true;
    }

    options.quality = options.quality || 100;

    const tmpFile = getTemporaryFile(options.type);

    let device = "png16m";

    switch (options.type) {
      case SupportedExtensions.BMP:
        device = options.bitmapColor ? "bmp32b" : "bmpmono";
        break;
      case SupportedExtensions.JPG:
        device = "jpeg";
        break;
    }

    const gs = new GhostScript();
    gs
      .batch()
      .noPause()
      .option("-dQUIET")
      .option("-dPARANOIDSAFER")
      .option("-dNOPROMPT")
      .device(device)
      .option("-dTextAlphaBits=4")
      .option("-dGraphicsAlphaBits=4")
      .option(`-r${options.quality}`)
      .output(tmpFile)
      .input(filePath)
      .option("-dFirstPage=1")
      .option("-dLastPage=1")
  });
}
