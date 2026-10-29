// Local-only regression checks. Requires Playwright and an installed Chromium browser.
const {chromium}=require('playwright');
const fs=require('node:fs');
const http=require('node:http');
const pathModule=require('node:path');
const publicRoot=pathModule.resolve(__dirname,'../public');
const out=process.env.LEGAL_QA_DIR;
if(out)fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}
 let file=pathModule.resolve(publicRoot,'.'+pathname);
 if(!file.startsWith(publicRoot+pathModule.sep)&&file!==publicRoot){res.writeHead(403);res.end();return;}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=pathModule.join(file,'index.html');
 if(!fs.existsSync(file)){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',file.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8');
 fs.createReadStream(file).pipe(res);
});
function startServer(){return new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(`http://127.0.0.1:${server.address().port}`)));}
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(pathModule.join(dir,e.name)):[pathModule.join(dir,e.name)]);}
(async()=>{
const browser=await chromium.launch({headless:true, ...(process.env.CHROME_EXECUTABLE ? {executablePath:process.env.CHROME_EXECUTABLE} : {})});
const errors=[],results=[]; const base=await startServer();
try {
for(const [locale,lang] of [['hi','hi'],['hi-IN','hi'],['hi-US','hi'],['en-IN','en'],['en-US','en'],['ko-KR','ko'],['es-ES','es'],['fr-FR','fr'],['pt-BR','pt-BR'],['pt-PT','en'],['id-ID','id'],['de-DE','de'],['ja-JP','ja']]) {
 const c=await browser.newContext({locale}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
 for(const k of ['terms','privacy']){await p.goto(`${base}/${k}/`);await p.waitForURL(`**/${k}/${lang}/v1.0/`);results.push({locale,k,path:new URL(p.url()).pathname});}
 await c.close();
}
const c=await browser.newContext({locale:'hi-IN'}),p=await c.newPage();
for(const [width,height] of [[320,320],[320,480],[800,360],[1280,900]])for(const scale of [1,2,3.2])for(const kind of ['terms','privacy','licenses']) {
 const path=kind==='licenses'?'/licenses/#hi':`/${kind}/hi/v1.0/`;
 await p.setViewportSize({width,height});await p.goto(base+path);await p.addStyleTag({content:`html{font-size:${scale*100}%}`});
 if(kind==='licenses')await p.locator('#hi').scrollIntoViewIfNeeded();
 const dims=await p.evaluate(()=>({vw:innerWidth,sw:document.documentElement.scrollWidth,lang:document.documentElement.lang}));
 if(dims.sw>dims.vw)errors.push({kind,width,height,scale,...dims});
 results.push({kind,width,height,scale,...dims});
 if(out&&width===320&&height===480&&scale===2)await p.screenshot({path:`${out}/${kind}-hi-large.png`});
}
await p.emulateMedia({colorScheme:'dark'});await p.goto(base+'/privacy/hi/v1.0/');if(out)await p.screenshot({path:out+'/privacy-hi-dark.png'});
const nojs=await browser.newContext({javaScriptEnabled:false}),np=await nojs.newPage();
for(const k of ['privacy','terms']){await np.goto(base+'/'+k+'/');if(await np.locator('li a').count()!==9)errors.push('no-JS language count '+k);await np.locator('a[lang="hi"]').click();if(!np.url().includes('/hi/v1.0/'))errors.push('manual Hindi '+k);}
for(const lang of ['en','ko','es','fr','pt-BR','id','de','ja','hi'])for(const kind of ['terms','privacy'])for(const scale of [1,2,3.2]) {
 await p.setViewportSize({width:320,height:480});await p.goto(`${base}/${kind}/${lang}/v1.0/`);await p.addStyleTag({content:`html{font-size:${scale*100}%}`});
 const dims=await p.evaluate(()=>({vw:innerWidth,sw:document.documentElement.scrollWidth}));
 if(dims.sw>dims.vw)errors.push({lang,kind,scale,...dims});results.push({lang,kind,scale,...dims});
}

// Explicit app destinations must not redirect according to browser language.
const languages=['en','ko','es','fr','pt-BR','id','de','ja','hi'];
for(const browserLocale of ['en-IN','hi-IN','fr-FR']) {
 const context=await browser.newContext({locale:browserLocale}), page=await context.newPage();
 for(const appLocale of languages) for(const kind of ['terms','privacy','licenses']) {
  const path=kind==='licenses'?'/licenses/'+(appLocale==='en'?'':'#'+appLocale):`/${kind}/${appLocale}/v1.0/`;
  const response=await page.goto(base+path);
  if(response.status()!==200||page.url()!==base+path)errors.push({browserLocale,appLocale,path,error:'wrong route'});
  if(kind!=='licenses'&&await page.locator('html').getAttribute('lang')!==appLocale)errors.push({path,error:'wrong content language'});
  if(kind==='licenses'&&appLocale!=='en'&&await page.locator(`[id="${appLocale}"]`).count()!==1)errors.push({path,error:'missing language anchor'});
  if(appLocale==='hi'&&kind!=='licenses'&&await page.locator('h2').count()!==(kind==='terms'?10:11))errors.push({path,error:'missing Hindi sections'});
  results.push({browserLocale,appLocale,path});
 }
 await context.close();
}
// Every existing local document/stylesheet link and fragment must resolve.
let internalLinks=0;
for(const file of walk(publicRoot).filter(f=>f.endsWith('.html'))) {
 const path='/'+pathModule.relative(publicRoot,file).split(pathModule.sep).join('/');
 await p.goto(base+path);
 const hrefs=await p.locator('[href]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
 for(const href of hrefs) {
  const url=new URL(href,base+path); if(url.origin!==base)continue;
  let target=pathModule.join(publicRoot,decodeURIComponent(url.pathname));
  if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=pathModule.join(target,'index.html');
  if(!fs.existsSync(target))errors.push({file,href,error:'missing local destination'});
  else if(url.hash) {
   const anchor=decodeURIComponent(url.hash.slice(1));
   if(!fs.readFileSync(target,'utf8').includes(`id="${anchor}"`))errors.push({file,href,error:'missing anchor'});
  }
  internalLinks++;
 }
}
if(out)fs.writeFileSync(out+'/browser-results.json',JSON.stringify({results,internalLinks,errors},null,2));
console.log(JSON.stringify({checks:results.length,internalLinks,errors}));if(errors.length)process.exitCode=1;
} finally {await browser.close(); await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
