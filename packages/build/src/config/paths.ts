import path from 'path';
import fs from 'fs';

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath: string) => path.resolve(appDirectory, relativePath);

const tsConfigPath = resolveApp('tsconfig.json');
const tsConfigProductionPath = resolveApp('tsconfig.dist.json');

const tsConfigProduction = fs.existsSync(tsConfigProductionPath) ? tsConfigProductionPath : tsConfigPath;

export const paths = {
  appBuild: 'dist',
  appSrc: resolveApp('src'),
  tsConfig: tsConfigPath,
  tsConfigProduction,
};
