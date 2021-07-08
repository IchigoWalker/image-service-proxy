import express from "express";
import { promisify } from "util";
import { createReadStream, unlink, rmdir } from "fs";
import { basename } from "path";
import { lookup } from "mime-types";

import { ImageHelper } from "./helpers/image-helper";
import { S3Helper } from "./helpers/s3-helper";
import { RequestHelper } from "./helpers/request-helper";

import { validateMiddleware } from "./middlewares/validateMiddleware";

const unlinkAsync = promisify(unlink);
const rmdirAsync = promisify(rmdir);

const s3Helper = new S3Helper();

const app = express();
app.disable("x-powered-by");

app.get("*", validateMiddleware, async (req, res) => {
  const targetFolder = `tmp/${Date.now()}_${
    Math.floor(Math.random() * 1000) + 1
  }`;

  const imageParams = ImageHelper.parseParams(req.url);

  const relativeUrl = req.url.substring(req.url.indexOf("/base") + 1);
  const thumbnailName = ImageHelper.getThumbnailName(
    req,
    relativeUrl,
    imageParams
  );

  const isThumbExists = await s3Helper.isObjectExists(thumbnailName);

  if (isThumbExists) {
    const filePath = await RequestHelper.downloadFile(
      `${s3Helper.basePath}${thumbnailName}`,
      targetFolder
    );

    const stream = createReadStream(filePath);

    stream.on("open", () => {
      res.set("Cache-Control", "public, max-age=31557600");
      res.set("Content-Type", lookup(filePath));
      stream.pipe(res);
    });

    stream.on("close", async () => {
      await unlinkAsync(filePath);
      await rmdirAsync(targetFolder);
    });
  } else {
    const filePath = await RequestHelper.downloadFile(
      `${s3Helper.basePath}${relativeUrl}`,
      targetFolder
    );
    const thumbnailBaseName = basename(thumbnailName);

    try {
      await ImageHelper.createThumbnail(
        imageParams,
        filePath,
        thumbnailBaseName,
        targetFolder
      );
    } catch (err) {
      console.log(err);
      const fallbackUrl = s3Helper.getFallbackUrl(relativeUrl, 400);

      res.redirect(301, fallbackUrl);

      await Promise.all([
        unlinkAsync(filePath),
        unlinkAsync(`${targetFolder}/${thumbnailBaseName}`),
      ]);
      await rmdirAsync(targetFolder);

      return;
    }

    const stream = createReadStream(`${targetFolder}/${thumbnailBaseName}`);

    stream.on("open", () => {
      res.set("Cache-Control", "public, max-age=31557600");
      res.set("Content-Type", lookup(`${targetFolder}/${thumbnailBaseName}`));
      stream.pipe(res);
    });

    stream.on("close", async () => {
      await s3Helper.putObject(thumbnailName, targetFolder);
      await Promise.all([
        unlinkAsync(filePath),
        unlinkAsync(`${targetFolder}/${thumbnailBaseName}`),
      ]);
      await rmdirAsync(targetFolder);
    });
  }
});

app.listen(6100, () => console.log(`Application started`));
