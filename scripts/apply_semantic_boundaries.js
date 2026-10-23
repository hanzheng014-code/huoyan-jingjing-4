const fs = require('fs');
const path = require('path');
const arg = name => { const i = process.argv.indexOf(name); return i < 0 ? null : process.argv[i + 1]; };
const input = arg('--input'), changesFile = arg('--changes'), outputDir = arg('--output-dir');
if (!input || !changesFile || !outputDir) throw new Error('Use --input <file.srt> --changes <boundary-changes.json> --output-dir <dir>.');
const parseTime = t => { const m=t.match(/(\d\d):(\d\d):(\d\d),(\d\d\d)/); return ((+m[1]*3600 + +m[2]*60 + +m[3])*1000 + +m[4]); };
const fmt = ms => { const h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000),x=ms%1000; return [h,m,s].map(n=>String(n).padStart(2,'0')).join(':')+','+String(x).padStart(3,'0'); };
const norm = s => s.replace(/\s/g,'');
const source = fs.readFileSync(input,'utf8').replace(/^\uFEFF/,'').replace(/\r/g,'').trim();
let cues = source.split(/\n\s*\n/).map(b=>{const l=b.split('\n');return {id:+l[0],time:l[1],text:l.slice(2).join(' ')};});
const changes = JSON.parse(fs.readFileSync(changesFile,'utf8'));
const logs=[];
for (const change of [...changes].sort((a,b)=>b.startCue-a.startCue)) {
  const start = cues.findIndex(c=>c.id===change.startCue), end = cues.findIndex(c=>c.id===change.endCue);
  if (start<0 || end<start || end-start>3 || !Array.isArray(change.segments) || !change.segments.length) throw new Error('Invalid boundary change.');
  const group=cues.slice(start,end+1), before=group.map(c=>c.text).join('');
  if (norm(before)!==norm(change.segments.join(''))) throw new Error(`Text mismatch for cues ${change.startCue}-${change.endCue}.`);
  const first=parseTime(group[0].time.split(' --> ')[0]), last=parseTime(group.at(-1).time.split(' --> ')[1]);
  const total=change.segments.reduce((n,s)=>n+[...s].length,0); let cursor=first;
  const replacement=change.segments.map((text,i)=>{const endMs=i===change.segments.length-1?last:cursor+Math.round((last-first)*[...text].length/total);const x={id:group[0].id,time:`${fmt(cursor)} --> ${fmt(endMs)}`,text};cursor=endMs;return x;});
  cues.splice(start,group.length,...replacement); logs.push({...change,before,after:change.segments.join(' / ')});
}
cues=cues.map((c,i)=>({...c,id:i+1})); fs.mkdirSync(outputDir,{recursive:true});
const stem=path.basename(input,path.extname(input)); const srt=path.join(outputDir,`${stem}_huoyan4.srt`),html=path.join(outputDir,`${stem}_huoyan4_boundary_review.html`);
fs.writeFileSync(srt,cues.map(c=>`${c.id}\n${c.time}\n${c.text}`).join('\n\n')+'\n','utf8');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
fs.writeFileSync(html,`<!doctype html><meta charset="utf-8"><title>火眼金睛 4.0｜断句复核</title><style>body{font-family:"Microsoft YaHei",sans-serif;margin:32px;color:#182230;background:#f5f7fb}article{background:#fff;border:1px solid #e4e7ec;border-radius:12px;padding:18px;margin:14px 0}mark{background:#fff0c2;padding:2px 4px}small{color:#667085}</style><h1>火眼金睛 4.0｜语义断句复核</h1><p>共 ${logs.length} 处。无音频时，修改组的时间按字符比例分配，均需试听复核。</p>${logs.map((x,i)=>`<article><b>断句 ${i+1}｜字幕 ${x.startCue}-${x.endCue}</b><p><small>原：</small>${esc(x.before)}</p><p><small>新：</small><mark>${esc(x.after)}</mark></p><small>${esc(x.reason)}；置信度：${esc(x.confidence)}</small></article>`).join('')}`,'utf8');
console.log(JSON.stringify({cues:cues.length,boundaries:logs.length,srt,html},null,2));
