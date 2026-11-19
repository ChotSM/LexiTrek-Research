import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const files=['app-icon.svg','app.js','data/research-pack.json','index.html','manifest.webmanifest','research-core.mjs','quest-engine.mjs','quest-ui.mjs','quest-styles.css','service-worker.js','styles.css'];
const sha=data=>createHash('sha256').update(data).digest('hex');
const hashes={};for(const file of files)hashes[file]=sha(await fs.readFile(new URL(file,root)));
const pkg=JSON.parse(await fs.readFile(new URL('package.json',root),'utf8'));
const build={version:pkg.version,sourceSha:sha(JSON.stringify(hashes)),files:hashes};
const text='// Generated from runtime sources; regenerate after a source edit.\nexport const BUILD = '+JSON.stringify(build,null,2)+';\n';
const target=new URL('release-build.mjs',root);
if(process.argv.includes('--check')){
  const saved=await fs.readFile(target,'utf8').catch(()=>'');
  if(saved!==text)throw Error('Runtime sources changed: run npm run build:manifest, review the change, then test.');
  console.log('Runtime source manifest matches.');
}else{await fs.writeFile(target,text);console.log('Generated runtime source manifest.');}
