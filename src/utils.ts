import * as cache from "@actions/cache";
import { info } from "@actions/core";
import isNil from "lodash/isNil";

const INSTALLATION_CACHE_KEY = "grpc-setup";

export async function restoreGrpcInstallation(
  versionSpec: string
): Promise<boolean> {
  const installationPath = process.env["CMAKE_PREFIX_PATH"];
  if (!isNil(installationPath)) {
    const versionCacheKey = `${INSTALLATION_CACHE_KEY}-${versionSpec}`;

    const cacheKey = await cache.restoreCache(
      [installationPath],
      versionCacheKey
    );

    if (!isNil(cacheKey)) {
      info(`Found grpc installation in cache @ ${installationPath}`);
      return true;
    }
  }
  return false;
}

export async function cacheGrpcInstallation(
  versionSpec: string
): Promise<void> {
  const installationPath = process.env["CMAKE_PREFIX_PATH"];
  if (!isNil(installationPath)) {
    const versionCacheKey = `${INSTALLATION_CACHE_KEY}-${versionSpec}`;

    const cacheId = await cache.saveCache([installationPath], versionCacheKey);

    info(`Cached grpc installation @ ${installationPath}`);
    info(`Cache ID: ${cacheId}`);
  }
}
