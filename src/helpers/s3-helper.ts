import { readFile } from "fs";
import { basename } from "path";
import { promisify } from "util";
import { S3 } from "@aws-sdk/client-s3";
import { lookup } from "mime-types";

import config from "../config.json";

const readFileAsync = promisify(readFile);

export class S3Helper {
  basePath: string;

  private client: S3;

  constructor() {
    this.basePath = `https://${config.amazon.s3.bucket}.s3.${config.amazon.s3.region}.amazonaws.com/`;

    this.client = new S3({
      region: config.amazon.s3.region,
      credentials: {
        accessKeyId: config.amazon.s3.credentials.key,
        secretAccessKey: config.amazon.s3.credentials.secret,
      },
      apiVersion: "latest",
    });
  }

  async isObjectExists(url: string) {
    const params = {
      Bucket: config.amazon.s3.bucket,
      Key: url,
    };

    try {
      const headCode = await this.client.headObject(params);
      console.log(
        `${
          headCode.$metadata.httpStatusCode
        }, ${new Date().toISOString()}: ${url}`
      );

      return true;
    } catch (err) {
      console.log(
        `${err.$metadata.httpStatusCode}, ${new Date().toISOString()}: ${url}`
      );
      return false;
    }
  }

  async putObject(thumbnailName: string, targetFolder: string) {
    const thumbnailBaseName = basename(thumbnailName);
    const fileName = `${targetFolder}/${thumbnailBaseName}`;

    const fileData = await readFileAsync(fileName);

    return this.client.putObject({
      Bucket: config.amazon.s3.bucket,
      Key: thumbnailName,
      Body: fileData,
      ContentType: lookup(fileName),
      ACL: "public-read",
      CacheControl: "max-age=31557600",
    });
  }

  // Function used for already existing thumbnails in case of resizing errors. Specific for my project only
  getFallbackUrl(url: string, key: number = 400): string {
    const parts = url.split("/");

    parts[parts.length] = parts[parts.length - 1];
    parts[parts.length - 2] = `thumbnails/${key}`;

    const thumbnailPath = parts.join("/");

    return `${this.basePath}${thumbnailPath}`;
  }
}
