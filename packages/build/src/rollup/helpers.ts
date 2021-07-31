import fs from 'fs-extra';
import path from 'path';
import { paths } from '../config/paths';

export const safePackageName = (name: string): string =>
  name.toLowerCase().replace(/(^@.*\/)|((^[^a-zA-Z]+)|[^\w.-])|([^a-zA-Z0-9]+$)/g, '');

export const writeCjsEntryFile = (name: string): Promise<void> => {
  let baseLine = `module.exports = require('./${safePackageName(name)}`;
  let contents = `
  'use strict'
  
  if (process.env.NODE_ENV === 'production') {
    ${baseLine}.cjs.production.min.js')
  } else {
    ${baseLine}.cjs.development.js')
  }
  `;

  return fs.outputFile(path.join(paths.appBuild, 'cjs', 'index.js'), contents);
};

export const emptyBuildDir = (): void => {
  if (process.env.WATCHING !== 'true') {
    console.warn(`emptying dist ${paths.appBuild}`);
    fs.emptyDirSync(paths.appBuild);
  } else {
    console.warn(`WATCHING so not deleting build directory`);
  }
};

export const writeToPackage = <D>(filename: string, data: D): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, JSON.stringify(data, null, 2), function (err) {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
};

