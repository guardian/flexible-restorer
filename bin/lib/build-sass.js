import Q from 'q';
import glob from 'glob';
import path from 'path';
import sass from 'node-sass';
import fs from 'fs';
import autoprefixer from 'autoprefixer';

const pGlob = Q.denodeify(glob);
const pReadFile = Q.denodeify(fs.readFile);
const pWriteFile = Q.denodeify(fs.writeFile);

export default () => {
  return Q.async(function* (){

    try{

    //because we cannot rely on a version number (used by jspm in the folder name) then we need to fuzzy match it
    //we also need to remove the .js bootstrap file jspm uses
    const sassPath = path.resolve(process.cwd(), 'public/jspm_packages/github/guardian/tools*');
    const dirs = yield pGlob(sassPath);
    const dir = dirs.filter((path) => !/js$/.test(path))[0];
    const componentSassDir = path.resolve(dir, 'sass');

    const restorerSass = path.resolve(process.cwd(), 'public/sass');
    const restorerSassFile = path.resolve(restorerSass, 'index.scss');

    //check if the index file is where is should be
    if (!fs.existsSync(restorerSassFile)) {
      throw new Error(`${restorerSassFile} does not exist`);
    }
    const sassData = yield pReadFile(restorerSassFile, 'utf8');

    //stupidly, node sass has decided to change the api such that sass.render({}, callback)
    //is no longer valid. Now we have to use the sync methods... Idiots
    const sassContent = sass.renderSync({
      data: sassData,
      includePaths: [
        restorerSass,
        componentSassDir
      ]
    }).css;

    const cssContent = autoprefixer.process(sassContent).css;
    const restorerCssDir = path.resolve(process.cwd(), 'public/css');
    const restorerCssFile = path.resolve(restorerCssDir, 'index.css');

    yield pWriteFile(restorerCssFile, cssContent, 'utf8');

    console.log('-----------------------');
    console.log('All css rendered correctly');
    console.log('-----------------------');
    process.exit(0);


    //handle all errors
    }
    catch (e){
      console.log('-----------------------');
      console.log(e);
      console.log('-----------------------');
      process.exit(1);
    }

  })().done();
}
