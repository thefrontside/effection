import { rollup } from 'rollup';
import { paths } from '../config/paths';
import fs from 'fs-extra';
import path from 'path';
import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import { assert } from 'assert-ts';
import injectProcessEnv from 'rollup-plugin-inject-process-env';
import babel, { RollupBabelInputPluginOptions } from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import sourceMaps from 'rollup-plugin-sourcemaps';
import { terser } from 'rollup-plugin-terser';
import { copyAssets } from './copy-assets';
import commonjs from '@rollup/plugin-commonjs';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import program from 'commander';
import { ModuleFormat } from '../types';
import { emptyBuildDir, safePackageName, writeCjsEntryFile, writeToPackage } from './helpers';

export interface BundlerOptions {
  packageName: string;
  entryFile: string;
  moduleFormat: ModuleFormat;
  env: 'development' | 'production';
  vizualize: boolean;
  analyze: boolean;
}

console.debug(`using ${path.basename(paths.tsConfigProduction)}`);

async function generateBundledModule({
  packageName,
  entryFile,
  moduleFormat,
  env,
}: BundlerOptions) {
  assert(fs.existsSync(entryFile), `Input file ${entryFile} does not exist`);

  let minify = env === 'production';

  let bundle = await rollup({
    input: entryFile,
    external: (id: string) => {
      if (id === 'babel-plugin-transform-async-to-promises/helpers') {
        return false;
      }

      return !id.startsWith('.') && !path.isAbsolute(id);
    },
    treeshake: {
      propertyReadSideEffects: false,
    },
    plugins: [
      resolve({
        mainFields: ['module', 'browser', 'main'],
        extensions: ['.mjs', '.cjs', '.js', '.ts', '.tsx', '.json', '.jsx'],
      }),
      commonjs(),
      json(),
      typescript({
        typescript: require('typescript'),
        tsconfig: paths.tsConfigProduction,
        abortOnError: true,
        tsconfigDefaults: {
          compilerOptions: {
            sourceMap: true,
            declaration: true
          },
        },
        tsconfigOverride: {
          compilerOptions: {
            sourceMap: true,
            target: 'esnext',
          },
        },
      }),
      babel({
        babelHelpers: 'runtime',
        sourceMaps: true,
        plugins: [["@babel/transform-runtime", { useESModules: true }]],
        extensions: [...DEFAULT_EXTENSIONS, 'ts', 'tsx'],
      } as RollupBabelInputPluginOptions),
      injectProcessEnv({
        NODE_ENV: env,
      }),
      minify &&
        terser({
          output: { comments: false },
          compress: {
            keep_infinity: true,
            pure_getters: true,
            passes: 10,
          },
          ecma: 5,
          toplevel: moduleFormat === 'cjs',
        }),
      sourceMaps()
    ].filter(Boolean),
  });

  let pkgName = safePackageName(packageName);
  let extension = env === 'production' ? 'min.js' : 'js';
  let fileName = ['esm', 'umd'].includes(moduleFormat)
    ? `${pkgName}.${moduleFormat}.js`
    : `${pkgName}.cjs.${env}.${extension}`;
  let outputFileName = path.join(paths.appBuild, moduleFormat, fileName);

  console.info(`writing ${path.basename(outputFileName)} for ${packageName}`);

  await bundle.write({
    file: outputFileName,
    format: moduleFormat,
    name: packageName,
    exports: 'named',
    sourcemap: true,
    esModule: moduleFormat !== 'umd',
    interop: 'auto',
    freeze: false,
    globals: { react: 'React' },
  });

  copyAssets();
}

const getInputFile = (packageName: string, inputFileOverride?: string): string => {
  if (inputFileOverride) {
    assert(fs.existsSync(inputFileOverride), `no --input-file found at ${inputFileOverride}`);

    return inputFileOverride;
  }

  let candidates: string[] = [];

  [packageName, path.join(packageName, 'index'), 'index', path.join('bin', safePackageName(packageName))].forEach(
    (candidate) => {
      ['.ts', '.tsx'].forEach((fileType) => {
        candidates.push(path.join(paths.appSrc, `${candidate}${fileType}`));
      });
    },
  );

  let inputFile = candidates.find((candidate) => fs.existsSync(candidate));

  assert(!!inputFile, 'No rootFile found for rollup');

  console.log(`using input file ${path.basename(inputFile)} for ${packageName}`);

  return inputFile;
};

async function build({
  vizualize,
  analyze,
  inputFile,
}: Pick<BundlerOptions, 'vizualize' | 'analyze'> & { inputFile?: string }) {
  emptyBuildDir();

  let pkgJsonPath = path.join(process.cwd(), 'package.json');

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  let { default: pkg } = await import(pkgJsonPath);

  let packageName = pkg.name;

  let entryFile = getInputFile(packageName, inputFile);

  let configs: { moduleFormat: ModuleFormat; env: 'development' | 'production' }[] = [
    { moduleFormat: 'cjs', env: 'development' },
    { moduleFormat: 'cjs', env: 'production' },
    { moduleFormat: 'esm', env: 'production' },
    { moduleFormat: 'umd', env: 'production' },
  ];

  console.info(`Generating ${packageName} bundle.`);

  for (let { moduleFormat, env } of configs) {
    await generateBundledModule({ packageName, entryFile, moduleFormat, env, vizualize, analyze });
  }

  await writeCjsEntryFile(packageName);

  let pkgJson = { ...pkg };

  let pkgName = safePackageName(packageName);

  let buildDir = path.basename(paths.appBuild);

  let commonjsFile = path.join(buildDir, 'cjs', 'index.js');
  pkgJson.main = commonjsFile;

  let esmFile = path.join(buildDir, 'esm', `${pkgName}.esm.js`);
  pkgJson.module = esmFile;

  let umdFile = path.join(buildDir, 'umd', `${pkgName}.umd.js`);
  pkgJson.browser = umdFile;

  let dtsFile = path.join(buildDir, 'esm', `index.d.ts`);
  pkgJson.types = dtsFile;

  pkgJson.exports = {
    import: `./${esmFile}`,
    require: `./${commonjsFile}`,
    browser: `./${umdFile}`,
  };

  pkgJson.typesVersions = {
    '*': {
      '*': [`${dtsFile}`],
    },
  };

  await writeToPackage(pkgJsonPath, pkgJson);
}

program
  .description('execute a rollup build')
  .option('-v, --vizualize', 'run the rollup-plugin-visualizer', false)
  .option('-a, --analyze', 'analyze the bundle', false)
  .option('-i, --input-file <path>', 'the entry file')
  .parse(process.argv)
  .action(async function ({ vizualize, inputFile, analyze }) {
    try {
      await build({ vizualize, inputFile, analyze });

      console.log('finished building');
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })
  .parse(process.argv);
