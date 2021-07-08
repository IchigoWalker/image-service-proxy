import { get } from "https";
import { promisify } from "util";
import { createWriteStream, unlink, mkdir } from "fs";
import { basename } from "path";
import { BrowserData } from "interfaces/browser-data.interface";
import UAParser from "ua-parser-js";

const unlinkAsync = promisify(unlink);
const mkdirAsync = promisify(mkdir);

export class RequestHelper {
  static async downloadFile(
    url: string,
    targetFolder: string
  ): Promise<string> {
    await mkdirAsync(targetFolder);

    const fileName = basename(url);
    const filePath = `${targetFolder}/${fileName}`;
    const fileStream = createWriteStream(filePath);

    return new Promise((resolve, reject) => {
      const req = get(url, (response) => {
        response.pipe(fileStream);

        fileStream.on("finish", () => {
          fileStream.close();
          return resolve(filePath);
        });
      });

      req.on("error", async (err) => {
        await unlinkAsync(filePath);

        return reject(err);
      });

      req.end();
    });
  }

  static getBrowserData(req): BrowserData {
    const parser = new UAParser();
    const ua = req.headers["user-agent"];
    const browser = parser.setUA(ua).getBrowser().name;
    const version = parser.setUA(ua).getBrowser().version;

    const [major, minor, patch] = version.split(".");

    return {
      browser,
      version: {
        major: parseInt(major || 0),
        minor: parseInt(minor || 0),
        patch: parseInt(patch || 0),
      },
    };
  }
}
