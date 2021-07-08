import sharp from "sharp";
import { extname, parse } from "path";

import { RequestHelper } from "./request-helper";

import { ImageParams } from "../interfaces/image-params.interface";
import { BrowserData } from "../interfaces/browser-data.interface";

export class ImageHelper {
  static getBestExt(req, url: string): string {
    const browserData = RequestHelper.getBrowserData(req);

    if (this.isAvifSupported(browserData)) {
      return "avif";
    }

    if (this.isWebpSupported(browserData)) {
      return "webp";
    }

    return extname(url);
  }

  private static isAvifSupported(browserData: BrowserData): boolean {
    const browsersToInclude: BrowserData[] = [
      { browser: "Chrome", version: { major: 85 } },
      { browser: "Opera", version: { major: 71 } },
      { browser: "Android Browser", version: { major: 91 } },
      { browser: "Opera Mobile", version: { major: 62 } },
      { browser: "Chrome", os: "Android", version: { major: 91 } },
      { browser: "Samsung Internet", version: { major: 14 } },
    ];

    return this.isBrowserGood(browsersToInclude, browserData);
  }

  private static isWebpSupported(browserData: BrowserData): boolean {
    const browsersToInclude: BrowserData[] = [
      { browser: "Edge", version: { major: 18 } },
      { browser: "Firefox", version: { major: 65 } },
      { browser: "Chrome", version: { major: 9 } },
      { browser: "Safari", version: { major: 14 } },
      { browser: "Opera", version: { major: 11, minor: 5 } },
      { browser: "Mobile Safari", version: { major: 14, minor: 4 } },
      { browser: "Opera Mini", version: { major: 0 } },
      { browser: "Android Browser", version: { major: 4 } },
      { browser: "Opera Mobile", version: { major: 12 } },
      { browser: "Chrome", os: "Android", version: { major: 91 } },
      { browser: "Firefox for Android", version: { major: 89 } },
      { browser: "UC Browser", version: { major: 12, minor: 12 } },
      { browser: "Samsung Internet", version: { major: 4 } },
      { browser: "QQ Browser", version: { major: 10, minor: 4 } },
      { browser: "Baidu Browser", version: { major: 7, minor: 12 } },
    ];

    return this.isBrowserGood(browsersToInclude, browserData);
  }

  private static isBrowserGood(
    browsersToInclude: BrowserData[],
    browserData: BrowserData
  ): boolean {
    return !!browsersToInclude.find((browser) => {
      const isMajorGood =
        browser.browser === browserData.browser &&
        browserData.version.major >= browser.version.major;

      if (!isMajorGood) {
        return false;
      }

      const isMinorGood = browser.version.minor
        ? browserData.version.minor >= browser.version.minor
        : true;

      if (!isMinorGood) {
        return false;
      }

      const isOSGood = browser.os ? browserData.os === browser.os : true;

      if (!isOSGood) {
        return false;
      }

      return true;
    });
  }

  static parseParams(url: string): ImageParams {
    const parts = url.split("/");

    const targetPart = parts.find((part) => part.startsWith("tr:"));
    const rawParams = targetPart.replace("tr:", "").split(",");

    const params = rawParams.reduce((agg, param) => {
      if (param.startsWith("w-")) {
        return {
          ...agg,
          w: parseInt(param.replace("w-", "")),
        };
      }

      if (param.startsWith("h-")) {
        return {
          ...agg,
          h: parseInt(param.replace("h-", "")),
        };
      }

      if (param.startsWith("f-")) {
        return {
          ...agg,
          f: param.replace("f-", ""),
        };
      }

      return agg;
    }, {});

    return params;
  }

  static getThumbnailName(req, url: string, imageParams: ImageParams): string {
    const parsedFileName = parse(url);
    const originalName = parsedFileName.name;

    const h = imageParams.h ? `h-${imageParams.h}` : "";
    const w = imageParams.w ? `w-${imageParams.w}` : "";

    const ext = imageParams.f;

    const originalNameWithExt = parsedFileName.base;
    const basePath = url.replace(originalNameWithExt, "");

    return `${basePath}${originalName}_${w}_${h}.${ext}`;
  }

  static async createThumbnail(
    imageParams: ImageParams,
    path: string,
    targetName: string,
    targetFolder: string
  ) {
    const paramArray = [imageParams.w, imageParams.h];
    const ext = extname(targetName);

    const stream = sharp(path).resize(...paramArray);

    switch (ext) {
      case ".avif":
        stream.avif({ quality: 80 });
        break;
      case ".webp":
        stream.webp({ quality: 80 });
        break;
      case ".jpg":
      case ".jpeg":
      case "jpeg2000":
        stream.jpeg({ quality: 80 });
        break;
      case ".png":
        stream.png({ quality: 80 });
        break;
    }

    // if (imageParams.w && !imageParams.h) {
    // stream.max();
    // }

    return stream.toFile(`${targetFolder}/${targetName}`);
  }
}
