import path from "path";
import { cpus } from "os";

import {
  info,
  getInput,
  setFailed,
  exportVariable,
  addPath,
} from "@actions/core";
import { exec } from "@actions/exec";
import { mkdirP } from "@actions/io";

function addEnvPath(name: string, value: string) {
  if (name in process.env) {
    exportVariable(name, `${process.env[name]}${path.delimiter}${value}`);
  } else {
    exportVariable(name, value);
  }
}

async function installGrpcVersion(versionSpec: string) {
  info("Cloning grpc repo...");
  await exec("git", [
    "clone",
    "--depth",
    "1",
    "--recurse-submodules",
    "--shallow-submodules",
    "-b",
    "v" + versionSpec,
    "https://github.com/grpc/grpc",
  ]);

  const extPath = "grpc";
  info(`Configuring in ${extPath}`);
  const buildDir = path.join(extPath, "build");
  await mkdirP(buildDir);
  const hostedtoolcache = process.env.AGENT_TOOLSDIRECTORY!;
  const prefixDir = path.join(hostedtoolcache, "grpc", versionSpec);
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
  await exec("make install", [], { cwd: buildDir });

  addPath(path.join(prefixDir, "bin"));
  addEnvPath("CMAKE_PREFIX_PATH", prefixDir);
  addEnvPath("LD_LIBRARY_PATH", path.join(prefixDir, "lib"));

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
