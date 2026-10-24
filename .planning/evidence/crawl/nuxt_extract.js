// Evaluate a page's window.__NUXT__ IIFE in an isolated vm context and print JSON.
const fs=require('fs'),vm=require('vm');
const h=fs.readFileSync(process.argv[2]==='-'?0:process.argv[2],'utf8');
const i=h.indexOf('window.__NUXT__');const j=h.indexOf('</script>',i);
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(h.slice(i,j),ctx,{timeout:5000});
process.stdout.write(JSON.stringify(ctx.window.__NUXT__));
