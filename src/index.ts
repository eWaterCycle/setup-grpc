import path from "path";
import { cpus } from "os";

import { info, getInput, setFailed, exportVariable, addPath } from "@actions/core";
import { exec } from "@actions/exec";
import { mkdirP } from "@actions/io";

async function installGrpcVersion(versionSpec: string) {
  info("Cloning grpc repo...");
  await exec("git", [
    "clone",
    "--depth",
    "1",
    "--recurse-submodules",
    "-b",
    "v" + versionSpec,
    "https://github.com/grpc/grpc",
  ]);

  const extPath = "grpc";
  info(`Configuring in ${extPath}`);
  const buildDir = path.join(extPath, "build");
  await mkdirP(buildDir);
  // TODO Install into tool-cache with output/envars for later cmake with CMAKE_PREFIX_PATH
  const prefixDir = "/usr/local";
  await exec(
    "cmake",
    [
      "-DgRPC_INSTALL=ON",
      "-DgRPC_SSL_PROVIDER=package",
      "-DgRPC_BUILD_TESTS=OFF",
      "-DBUILD_SHARED_LIBS=ON",
      `-DCMAKE_INSTALL_PREFIX=${prefixDir}`,
      "..",
    ],
    { cwd: buildDir }
  );

  info(`Compiling in ${buildDir}`);
  const jn = cpus().length.toString();
  await exec("make", ["-j", jn], { cwd: buildDir });

  info(`Installing to ${prefixDir}`);
  await exec("sudo make install", [], { cwd: buildDir });
  await exec("sudo ldconfig", []);

  // exportVariable('CMAKE_PREFIX_PATH', prefixDir);
  // addPath(path.join(prefixDir, 'bin'));

  return prefixDir;
}

async function main() {
  const versionSpec = getInput("grpc-version");
  info(`Setup grpc version spec ${versionSpec}`);

  await installGrpcVersion(versionSpec);
  info(`Successfully setup grpc version ${versionSpec}`);
}

main()
  .then((msg) => {
    console.log(msg);
  })
  .catch((err) => {
    setFailed(err.message);
  });
