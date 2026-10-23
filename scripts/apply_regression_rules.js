const fs = require('fs');
const path = require('path');
const arg = n => { const i=process.argv.indexOf(n); return i<0?null:process.argv[i+1]; };
const input=arg('--input'), outputDir=arg('--output-dir');
if(!input||!outputDir) throw new Error('Use --input <file.srt> --output-dir <dir>.');
const source=fs.readFileSync(input,'utf8').replace(/^\uFEFF/,'').replace(/\r/g,'').trim();
const log=[];
const rules=[
  {from:/[嗯啊呀哈哎呃额诶哦噢唉啦呐啧嘿]+/g,to:'',reason:'语气词删除'},
  {from:/([很挺得美更较还])\s+(好(?:的)?)/g,to:'$1$2',reason:'评价结构不拆分'},
  {from:/悠闲的(?=喝|看|说|拍)/g,to:'悠闲地',reason:'副词“的/地”'},
  {from:/完整的(?=出现|表达|展示|呈现)/g,to:'完整地',reason:'副词“的/地”'},
  {from:/清楚的(?=告诉|看到|表达|展示)/g,to:'清楚地',reason:'副词“的/地”'},
  {from:/明显的(?=不|表现|看到|体现)/g,to:'明显地',reason:'副词“的/地”'},
  {from:/自然的(?=不|去|表现)/g,to:'自然地',reason:'副词“的/地”'},
  {from:/精细的(?=去|调整)/g,to:'精细地',reason:'副词“的/地”'},
  {from:/尽可能的(?=减少|避免|去)/g,to:'尽可能地',reason:'副词“的/地”'},
  {from:/一目了然的(?=就|知道|看到)/g,to:'一目了然地',reason:'副词“的/地”'},
  {from:/非常的(?=明显|自然|重要|漂亮|简洁|清晰)/g,to:'非常地',reason:'副词“的/地”'},
  {from:/很好的(?=去|把|能够|体现|表现)/g,to:'很好地',reason:'副词“的/地”'},
  {from:/胶段/g,to:'焦段',reason:'摄影术语'},
  {from:/相接的顺序/g,to:'衔接的顺序',reason:'剪辑术语搭配'}
];
const cues=source.split(/\n\s*\n/).map(b=>{const l=b.split('\n');let text=l.slice(2).join(' '),orig=text;for(const r of rules)text=text.replace(r.from,r.to);if(text!==orig)log.push({cue:+l[0],from:orig,to:text});return{id:l[0],time:l[1],text};});
fs.mkdirSync(outputDir,{recursive:true});const stem=path.basename(input,path.extname(input));const out=path.join(outputDir,`${stem}_regression.srt`);fs.writeFileSync(out,cues.map(c=>`${c.id}\n${c.time}\n${c.text}`).join('\n\n')+'\n','utf8');fs.writeFileSync(path.join(outputDir,`${stem}_regression_changes.json`),JSON.stringify(log,null,2),'utf8');console.log(JSON.stringify({cues:cues.length,changes:log.length,out},null,2));
