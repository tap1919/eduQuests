'use strict';
const app=document.getElementById('app');
const KEY='power-of-ten-ch1-v1';
const glossary={subtle:'Faint or difficult to notice.',stifle:'To hold back a sound or feeling.',symmetrical:'Having matching parts on opposite sides.',sincere:'Honest and truly meant.',synthesize:'To combine parts to create a whole.'};
const names=['Desert discovery','Power of ten','Build the code','Scan a digit','Separate the power','Empty places','Decimal bridge','The final seal'];
const defaults={stage:-1,story:0,solved:[],crystals:0,badges:[],color:'turquoise',sound:false,complete:false};
let state;try{state={...defaults,...JSON.parse(localStorage.getItem(KEY)||'null')};if(!Array.isArray(state.solved)||state.stage>8)throw Error();}catch{state={...defaults};}
let tiles=[],selected=null,scan=null,scaled=false,feedback='',correct=false,hints=0,coach='',audioCtx;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function word(w){return `<button class="word" data-word="${w}">${w}</button>`;}
const story=[()=>`The first sign that something is wrong is the sand. It is moving uphill. You follow the streams toward a buried doorway. A ${word('subtle')} vibration travels through your tablet.`,()=>`The ground opens! You slide into a chamber and land beside two bronze feet. “Oh, excellent,” says a small robot. “You’re alive. That improves our chances considerably.” You ${word('stifle')} a nervous laugh.`,()=>`“I am TEN, keeper of the Grand Archive.” Two ${word('symmetrical')} doors tower behind him. Beyond them lies a lost city, its pyramids and stepped temples silent in the dark.`,()=>`“The city’s numbers have scattered,” TEN says. “We must learn their values, then ${word('synthesize')} the pieces into whole numbers again.” His voice sounds surprisingly ${word('sincere')}. Your tablet lights up. Your training begins.`];
const tasks={
1:{title:'Same digit. Different power.',desc:'Explore the console. Move the 5 from ones to tens, then inspect what changes.',coach:'The columns tell us how many groups a digit represents. Let’s move the 5 one place to the left.',hint:['Ones are single units. Tens are groups of ten.','Five tens means five groups of ten: 10 + 10 + 10 + 10 + 10.'],example:'A 3 in ones is worth 3. The same 3 in tens is worth 30. Its value becomes ten times as much.'},
2:{title:'Restore the navigation code',desc:'Build two hundred forty-six. Choose a digit tile, then choose its column. You can also drag tiles.',coach:'Start with the words: two hundred. Which digit belongs in the hundreds column?',hint:['Match each part of the words to a column: hundreds, tens, ones.','Two hundred means 2 hundreds. Forty means 4 tens. Six means 6 ones.'],example:'Three hundred twelve is 312: 3 hundreds, 1 ten, and 2 ones.'},
3:{title:'Find the hidden forty',desc:'In 246, select the digit whose value is forty. Then name its place and type its value.',coach:'A digit and its value are different. The column tells you what the digit is worth.',hint:['Find the tens column. Each ten is worth 10.','The middle digit counts the tens. Multiply that digit by 10 to find its value.'],example:'In 583, the digit 8 is in the tens place. Its value is 80.'},
4:{title:'Separate the power supply',desc:'Write 246 in expanded form. Use a plus sign between the value of each digit.',coach:'Expanded form shows how much each digit contributes. Break the number into hundreds, tens, and ones.',hint:['The 2 represents two hundreds, the 4 represents four tens, and the 6 represents six ones.','Write the value of each digit, then join those values with + signs.'],example:'583 = 500 + 80 + 3. We write each digit’s value, not just the digits.'},
5:{title:'The hall of empty places',desc:'Build four thousand five and eight hundredths. Keep every place, including the empty ones.',coach:'Some places contain no groups. Zero holds those places so the other digits keep their values.',hint:['The whole-number part is four thousand five. The decimal part is eight hundredths.','No hundreds, no tens, and no tenths are named. Those columns need zeros.'],example:'Two thousand three and six hundredths is 2,003.06. The zeros hold empty hundreds, tens, and tenths.'},
6:{title:'Light the decimal bridge',desc:'Write 42.06 in expanded form. Leave out places that contribute zero.',coach:'The 6 is two places to the right of the decimal point. Count tenths, then hundredths.',hint:['The 4 contributes 40, and the 2 contributes 2. What does the 6 contribute?','Six hundredths is 0.06. Six tenths would be 0.6, a different value.'],example:'31.08 = 30 + 1 + 0.08. The hundredths digit contributes eight hundredths.'},
7:{title:'Open the archive’s final seal',desc:'Work independently: write “three hundred seven and five hundredths” in standard form. Then identify the value of its 5.',coach:'You have all the tools you need. Build the whole-number part, preserve empty places, and count decimal places carefully.',hint:['The whole-number part has hundreds and ones, with no tens.','The decimal part has five hundredths, with no tenths. Use a zero to hold the tenths place.'],example:'Six hundred two and nine hundredths is 602.09. Its 9 has a value of 0.09.'}
};
function header(){return `<header><div class="brand"><b class="pixel">Ⅹ</b><div>POWER OF TEN<small>LOST CIVILIZATION · CHAPTER ONE</small></div></div><div class="nav"><span class="relic-count">◆ ${state.crystals} shards</span><button id="fieldGuide">Field guide</button><button id="journal">Journal</button><button id="sound" aria-pressed="${state.sound}">Sound ${state.sound?'on':'off'}</button><button id="home" aria-label="Return to title">Title</button></div></header>`;}
function shell(){app.innerHTML=header()+`<div class="layout"><main><div class="chapter-head"><div><div class="eyebrow">Chapter 01 / The Awakening</div><h1>${state.stage===0?'Beneath the shifting sands':state.stage===8?'The archive awakens':names[state.stage]}</h1></div><span class="step">${state.stage===0?'PROLOGUE':state.stage===8?'CHAPTER COMPLETE':`SEAL ${state.stage} / 7`}</span></div><div class="scene"><canvas id="world" width="1120" height="400" aria-label="Pixel art ruins gradually restored as you solve puzzles"></canvas><span class="scene-label">${state.stage===0?'THE LOST VALLEY':'THE GRAND ARCHIVE'}</span><span class="scene-progress">${state.solved.length} / 7 systems restored</span></div><section class="quest" id="quest"></section></main>${sidebar()}</div>`;bindHeader();drawWorld();renderQuest();bindSide();}
function sidebar(){let t=tasks[state.stage];return `<aside><div class="coach-title"><div class="ten-portrait" aria-hidden="true"></div><div><h2>TEN</h2><span>YOUR ARCHIVE GUIDE</span></div></div><div class="coach-bubble" id="coach" aria-live="polite">${esc(coach||t?.coach||'Every place has a purpose. Every digit has a value. Let’s discover them together.')}</div>${state.stage>0&&state.stage<8?'<div class="coach-controls"><button id="hint">↗ Give me a hint</button><button id="example">▤ Show a different example</button><button id="chart">▦ Open the place-value chart</button><button id="coachWalkthrough">Read the place-value scroll</button></div>':''}<div class="sidebar-label">Your expedition</div><div class="progressbar"><span style="width:${state.solved.length/7*100}%"></span></div><div class="trail">${names.map((n,i)=>`<div class="trail-item ${state.solved.includes(i)?'done':state.stage===i?'current':''}"><i>${state.solved.includes(i)?'✓':i===0?'•':i}</i><span>${n}</span></div>`).join('')}</div><div class="sidebar-label">Artifacts & badges</div>${state.badges.length?state.badges.map(b=>`<div class="badge">✦ ${b}</div>`).join(''):'<p class="small">Restore your first system to uncover a badge.</p>'}<p class="small">Hints are always free. No timer. No lost lives.<br>Progress saves on this browser.<br>TEN uses guided coaching in this chapter.</p></aside>`;}
function bindHeader(){document.getElementById('fieldGuide').onclick=openChart;document.getElementById('home').onclick=()=>title();document.getElementById('journal').onclick=journal;document.getElementById('sound').onclick=()=>{state.sound=!state.sound;save();document.getElementById('sound').textContent='Sound '+(state.sound?'on':'off');document.getElementById('sound').setAttribute('aria-pressed',state.sound);if(state.sound)chime();};}
function title(){app.innerHTML=header()+`<div class="cover"><img src="assets/cover.png" alt="Power of Ten: Lost Civilization. A pixel art explorer and bronze robot discover an ancient city of pyramids and ziggurats."><button class="cover-action" id="start">${state.stage>=0?'CONTINUE EXPEDITION':'BEGIN ADVENTURE'}</button></div><div class="intro-footer"><p><strong>Chapter One · The Awakening</strong>Uncover a lost city. Restore its numbers. Awaken its power.<br><a class="chapter-link" href="falling-seals.html">Chapter Two · The Falling Seals →</a><br><a class="chapter-link" href="scribes.html">Chapter Three · The Chamber of Scribes →</a><br><a class="chapter-link" href="rounding-scroll.html">Chapter Four · Rounding Scroll →</a><br><a class="chapter-link" href="mummy-battle.html">Final Battle · The Mummy’s Last Stand →</a></p><p><strong>Explore. Understand. Restore.</strong>Whole numbers · Expanded form · Decimal place value<br>About 15–20 minutes · Mouse, touch, and keyboard</p></div>`;bindHeader();document.getElementById('start').onclick=()=>{if(state.stage<0){state.stage=0;save();}shell();};}
function resetTask(){tiles=[];selected=null;scan=null;scaled=false;feedback='';correct=false;hints=0;coach='';}
function advance(){state.stage++;resetTask();save();shell();document.querySelector('h1').setAttribute('tabindex','-1');document.querySelector('h1').focus();}
function slots(labels){return `<div class="console">${labels.map((l,i)=>`${l==='Tenths'?'<span class="dot" aria-label="decimal point">.</span>':''}<div class="slot-wrap"><label>${l}</label><button class="slot ${tiles[i]!==undefined?'filled':''}" data-slot="${i}" aria-label="${l}: ${tiles[i]??'empty'}">${tiles[i]??'?'}</button></div>`).join('')}</div><div class="tile-bank" aria-label="Digit tiles">${Array.from({length:10},(_,i)=>`<button draggable="true" class="tile ${selected===i?'selected':''}" data-tile="${i}" aria-pressed="${selected===i}">${i}</button>`).join('')}</div><p class="hint-line">Choose a tile, then its place. Tiles can be reused. Select a filled place with no tile selected to clear it.</p>`;}
function renderQuest(){const q=document.getElementById('quest');if(state.stage===0){q.innerHTML=`<div class="eyebrow">A city waiting to be found</div><div class="story">${story[state.story]()}</div><div class="story-actions"><span class="small">${state.story+1} / ${story.length} · Tap gold words to discover their meanings.</span><button class="primary" id="storyNext">${state.story===3?'Meet TEN & begin training':'Continue →'}</button></div>`;q.querySelectorAll('[data-word]').forEach(b=>b.onclick=()=>modal(b.dataset.word,`<p>${glossary[b.dataset.word]}</p>`));document.getElementById('storyNext').onclick=()=>{if(state.story<3){state.story++;save();renderQuest();drawWorld();}else advance();};return;}
if(state.stage===8){finish(q);return;}const t=tasks[state.stage];q.innerHTML=`<h2>${t.title}</h2><p class="instruction">${t.desc}</p><div id="activity"></div><div id="response" role="status" aria-live="polite"></div><div class="actions" id="actions"></div>`;const a=document.getElementById('activity');
if(state.stage===1){a.innerHTML=`<div class="scroll-invite"><button id="lessonWalkthrough" class="primary">Unroll the place-value lesson</button></div><div class="console"><div class="slot-wrap"><label>Tens</label><button class="slot ${scaled?'filled':''}" id="tens" aria-label="Move 5 to tens">${scaled?'5':'←'}</button></div><div class="slot-wrap"><label>Ones</label><button class="slot ${!scaled?'filled':''}" id="ones" aria-label="Return 5 to ones">${scaled?'':'5'}</button></div></div><p style="text-align:center">5 ${scaled?'tens':'ones'} = <span class="number">${scaled?'50':'5'}</span></p><div class="scaling-lights" aria-label="${scaled?'50':'5'} units">${'<span></span>'.repeat(scaled?50:5)}</div>`;document.getElementById('lessonWalkthrough').onclick=openWalkthrough;document.getElementById('tens').onclick=()=>{scaled=true;renderQuest();};document.getElementById('ones').onclick=()=>{scaled=false;renderQuest();};document.getElementById('actions').innerHTML=`<button class="primary" id="check" ${scaled?'':'disabled'}>Its value is ten times as much →</button>`;document.getElementById('check').onclick=()=>win('The 5 changed from 5 ones to 5 tens: 5 → 50. One place left makes its value ten times as much.');}
if(state.stage===2||state.stage===5){a.innerHTML=slots(state.stage===2?['Hundreds','Tens','Ones']:['Thousands','Hundreds','Tens','Ones','Tenths','Hundredths']);bindTiles();checkButton();}
if(state.stage===3){a.innerHTML=`<div class="choice-grid" aria-label="Choose a digit">${[2,4,6].map(n=>`<button data-scan="${n}" class="${scan===n?'selected':''}" aria-pressed="${scan===n}">${n}</button>`).join('')}</div><div class="input-row"><label>Place <select id="place"><option value="">Choose a place</option><option>Hundreds</option><option>Tens</option><option>Ones</option></select></label><label>Value <input id="value" inputmode="decimal" placeholder="Type its value" style="width:130px"></label></div>`;a.querySelectorAll('[data-scan]').forEach(b=>b.onclick=()=>{scan=Number(b.dataset.scan);a.querySelectorAll('[data-scan]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',x===b);});});checkButton();}
if(state.stage===4||state.stage===6){a.innerHTML=`<div class="number">${state.stage===4?'246':'42.06'} =</div><label class="small" for="expanded">Expanded form</label><div class="input-row"><input id="expanded" placeholder="Example: 500 + 80 + 3" autocomplete="off" spellcheck="false"></div>`;checkButton();}
if(state.stage===7){a.innerHTML=`<div class="input-row"><label>Standard form<br><input id="standard" placeholder="Build the number" inputmode="decimal"></label><label>Value of the 5<br><input id="value" placeholder="What is it worth?" inputmode="decimal"></label></div><label for="explain" class="small" style="display:block;margin-top:15px">Optional reflection: how did you decide where to put the zeros?</label><input id="explain" placeholder="I used zeros because…" maxlength="300"><p class="small">Your reflection stays on this browser. TEN’s coaching is guided; it does not evaluate free writing.</p>`;checkButton();}
if(feedback)showFeedback(feedback,correct);if(correct)lockActivity();q.querySelectorAll('input').forEach(i=>i.onkeydown=e=>{if(e.key==='Enter')document.getElementById('check')?.click();});}
function bindTiles(){document.querySelectorAll('[data-tile]').forEach(b=>{b.onclick=()=>{selected=Number(b.dataset.tile);document.querySelectorAll('[data-tile]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',x===b);});};b.ondragstart=e=>e.dataTransfer.setData('text/plain',b.dataset.tile);});document.querySelectorAll('[data-slot]').forEach(b=>{const put=n=>{if(correct)return;tiles[Number(b.dataset.slot)]=n;selected=null;renderQuest();};b.onclick=()=>put(selected===null?undefined:selected);b.ondragover=e=>e.preventDefault();b.ondrop=e=>{e.preventDefault();const v=e.dataTransfer.getData('text/plain');if(/^\d$/.test(v))put(Number(v));};});}
function checkButton(){document.getElementById('actions').innerHTML='<button id="check" class="primary">Activate mechanism →</button>';document.getElementById('check').onclick=check;}
function numberInput(s){if(!/^\s*(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?|\.\d+)\s*$/.test(s))return NaN;return Number(s.replace(/,/g,''));}
function expandedValid(s,expected){const pieces=s.split('+').map(numberInput);return pieces.length===expected.length&&pieces.every(Number.isFinite)&&pieces.sort((a,b)=>a-b).every((x,i)=>Math.abs(x-[...expected].sort((a,b)=>a-b)[i])<1e-9);}
function check(){let ok=false,msg='';if(state.stage===2){ok=tiles.join('')==='246'&&tiles.length===3;msg=tiles.some(x=>x===undefined)||tiles.length<3?'Fill every column first. Look at the words to find the value for each place.':'Read each column aloud: hundreds, tens, ones. Does your code say two hundred forty-six?';}
if(state.stage===3){ok=scan===4&&document.getElementById('place').value==='Tens'&&numberInput(document.getElementById('value').value)===40;msg=scan!==4?'Look for the digit counting groups of ten. Its value must be forty.':'You found the digit. Check its place name and remember: four tens has a value greater than four.';}
if(state.stage===4){ok=expandedValid(document.getElementById('expanded').value,[200,40,6]);msg='Check each digit’s value: 2 hundreds, 4 tens, and 6 ones. Use the value of each group and join the three terms with + signs.';}
if(state.stage===5){ok=tiles.length===6&&tiles.every((n,i)=>n===[4,0,0,5,0,8][i]);msg='Check the whole-number part and the decimal part separately. Zero holds empty hundreds, tens, and tenths. Eight hundredths belongs two places after the decimal.';}
if(state.stage===6){ok=expandedValid(document.getElementById('expanded').value,[40,2,.06]);msg='Check the 6 carefully. There are zero tenths and six hundredths. Write three nonzero digit values joined by + signs.';}
if(state.stage===7){ok=numberInput(document.getElementById('standard').value)===307.05&&numberInput(document.getElementById('value').value)===.05;msg='Separate the words at “and.” Build three hundred seven first. Then add five hundredths, preserving the empty tenths place.';}
if(ok){const success={2:'246 restored: 2 hundreds + 4 tens + 6 ones. The navigation system is online!',3:'Digit: 4. Place: tens. Value: 40. You can tell the difference between a digit, its place, and its value.',4:'246 = 200 + 40 + 6. Three separate values now power one complete number.',5:'4,005.08 restored. The zeros keep the 4, 5, and 8 in their correct places.',6:'42.06 = 40 + 2 + 0.06. Six hundredths lights the final section of the bridge.',7:'307.05 is correct, and the 5 is worth 0.05. The archive recognizes its new keeper!'};if(state.stage===7){try{localStorage.setItem(KEY+'-reflection',document.getElementById('explain').value);}catch{}}win(success[state.stage]);}else{feedback=msg;correct=false;showFeedback(msg,false);setCoach(msg);}}
function showFeedback(msg,success){document.getElementById('response').innerHTML=`<div class="feedback ${success?'success':''}">${success?'✦ ':''}${esc(msg)}</div>`;}
function win(msg){if(correct)return;correct=true;feedback=msg;const fresh=!state.solved.includes(state.stage);if(fresh){state.solved.push(state.stage);state.crystals+=20;let badge=state.stage===1?'Power Finder':state.stage===4?'Number Architect':state.stage===6?'Decimal Pathfinder':state.stage===7?'Keeper of the First Seal':null;if(badge&&!state.badges.includes(badge))state.badges.push(badge);save();toast(badge?`✦ ${badge} unlocked · +20 shards`:'+20 shards · A system awakens');celebrate();chime();}showFeedback(msg,true);setCoach(state.stage===7?'You restored the first seal. You earned it by understanding the places—even the empty ones.':'System restored! Your understanding is bringing the archive back to life.');lockActivity();drawWorld();document.querySelector('.scene-progress').textContent=`${state.solved.length} / 7 systems restored`;document.querySelector('.relic-count').textContent=`◆ ${state.crystals} shards`;document.querySelector('aside').outerHTML=sidebar();bindSide();}
function lockActivity(){document.getElementById('activity').querySelectorAll('button,input,select').forEach(x=>x.disabled=true);document.getElementById('actions').innerHTML=`<button class="primary" id="next">${state.stage===7?'Enter the archive →':'Continue expedition →'}</button>`;document.getElementById('next').onclick=advance;}
function bindSide(){document.getElementById('coachWalkthrough')?.addEventListener('click',openWalkthrough);document.getElementById('hint')?.addEventListener('click',()=>{let t=tasks[state.stage];setCoach(t.hint[Math.min(hints++,t.hint.length-1)]+' Take another look. You can try as often as you need.');});document.getElementById('example')?.addEventListener('click',()=>setCoach(tasks[state.stage].example));document.getElementById('chart')?.addEventListener('click',openChart);}
function setCoach(s){coach=s;const el=document.getElementById('coach');if(el)el.textContent=s;}
function finish(q){state.complete=true;save();q.className='quest finish';q.innerHTML=`<div class="eyebrow">Chapter complete</div><div class="big-relic pixel">◈</div><h2>You awakened the archive.</h2><p>The bridge glows. The river flows. And TEN has a new partner.</p><div class="rewards"><div class="reward-card"><strong>FIRST SEAL</strong><span class="small">Your first restored artifact</span></div><div class="reward-card"><strong>${state.crystals} SHARDS</strong><span class="small">Earned through understanding</span></div><div class="reward-card"><strong>7 SYSTEMS</strong><span class="small">Restored to the lost city</span></div></div><p style="margin-top:25px">Choose TEN’s expedition glow. Both colors are now unlocked.</p><div class="color-options"><button data-color="turquoise" class="${state.color==='turquoise'?'active':''}">Turquoise glow</button><button data-color="amber" class="${state.color==='amber'?'active':''}">Amber glow</button></div><p class="small">You practiced standard form, identified a digit’s place and value, preserved zero placeholders, and wrote expanded form with whole numbers and decimals.</p><p><strong>Beyond the archive: The River of Ten</strong><br><span class="small">The next chapter is still to be explored.</span></p><div class="actions" style="justify-content:center"><button id="review">Review your discoveries</button><a class="chapter-link" href="falling-seals.html">Enter Chapter Two · The Falling Seals →</a><button id="replay" class="primary">Replay chapter</button></div>`;q.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{state.color=b.dataset.color;save();applyColor();finish(q);drawWorld();toast('TEN’s '+state.color+' glow equipped');});document.getElementById('review').onclick=journal;document.getElementById('replay').onclick=()=>{modal('Start a fresh expedition?',`<p>This resets the chapter, shards, and badges on this browser.</p><button class="primary" id="confirmReset">Start again</button>`);document.getElementById('confirmReset').onclick=()=>{document.querySelector('dialog').close();state={...defaults,solved:[],badges:[],sound:state.sound,stage:0};resetTask();save();shell();};};}
function applyColor(){document.documentElement.style.setProperty('--accent',state.color==='amber'?'#ffc75c':'#74e6cc');}
function modal(title,html){document.querySelector('dialog')?.remove();const d=document.createElement('dialog');d.innerHTML=`<h2>${title}</h2>${html}<div style="margin-top:22px"><button id="closeDialog">Return to expedition</button></div>`;document.body.append(d);d.showModal();d.querySelector('#closeDialog').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d&&e.clientX<d.getBoundingClientRect().left)d.close();});}

function openWalkthrough() {
  modal('Place Value Scroll', '<iframe class="walkthrough-frame" title="TEN’s interactive place-value walkthrough" src="place-value-scroll.html"></iframe>');
  const dialog = document.querySelector('dialog');
  dialog.classList.add('walkthrough-dialog');
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
}
function openChart(){
const digits=[['Thousands','4','1,000','4,000'],['Hundreds','5','100','500'],['Tens','8','10','80'],['Ones','2','1','2'],['Tenths','7','0.1','0.7'],['Hundredths','3','0.01','0.03'],['Thousandths','6','0.001','0.006']];
modal('The archive’s place-value tablet',`<img class="guide-art" src="assets/place-value-chart.png" alt="Place value chart for 4,582.736. Whole-number places: thousands 4, hundreds 5, tens 8, ones 2. Decimal places: tenths 7, hundredths 3, thousandths 6. Each place is ten times the place to its right."><section class="guide-explore"><h3>Inspect the ancient number: 4,582.736</h3><p class="small">Select any digit to reveal its place and value.</p><div class="guide-digits">${digits.map(([place,digit,unit,value],i)=>`${i===4?'<span class="guide-decimal" aria-label="decimal point">.</span>':''}<button data-guide-digit="${i}" aria-pressed="false"><small>${place}</small><strong>${digit}</strong></button>`).join('')}</div><div class="feedback success" id="guideDetail" aria-live="polite">Choose a digit above to inspect its value.</div><p class="small">The decimal point separates ones from tenths. One place left has 10 times the value; one place right has one tenth the value.</p></section>`);
const d=document.querySelector('dialog');d.classList.add('chart-dialog');
d.querySelectorAll('[data-guide-digit]').forEach(b=>b.onclick=()=>{const [place,digit,unit,value]=digits[Number(b.dataset.guideDigit)];d.querySelectorAll('[data-guide-digit]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',x===b);});document.getElementById('guideDetail').innerHTML=`<strong>Digit: ${digit}</strong> · Place: ${place.toLowerCase()} · <strong>Value: ${value}</strong><br>${digit} × ${unit} = ${value}`;});
}

function journal(){modal('Explorer’s journal',`<div class="eyebrow">${state.solved.length} / 7 systems restored · ${state.crystals} shards</div><p style="margin-top:15px">${state.badges.length?state.badges.map(b=>'✦ '+b).join('<br>'):'Your discoveries will appear here.'}</p><h3>Discoveries</h3><p class="small">${state.solved.includes(1)?'✓ One place left makes a digit’s value ten times as much.<br>':''}${state.solved.includes(3)?'✓ Digit, place, and value tell different things.<br>':''}${state.solved.includes(4)?'✓ Expanded form adds each digit’s value.<br>':''}${state.solved.includes(5)?'✓ Zeros preserve empty places.<br>':''}${state.solved.includes(6)?'✓ Hundredths are two places after the decimal.<br>':''}</p><h3>Words from the archive</h3><dl class="glossary-list">${Object.entries(glossary).map(([w,d])=>`<dt>${w}</dt><dd>${d}</dd>`).join('')}</dl><p class="small">This is a fantasy civilization inspired by Egyptian and Mesopotamian architecture. Its modern decimal puzzles are fictional, rather than a reconstruction of ancient number systems.</p>`);}
function toast(t){const e=document.getElementById('toast');e.textContent=t;e.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.classList.remove('show'),3200);}
function chime(){if(!state.sound)return;try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume();[392,523,659,784].forEach((f,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.04,audioCtx.currentTime+i*.1);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+i*.1+.3);o.connect(g);g.connect(audioCtx.destination);o.start(audioCtx.currentTime+i*.1);o.stop(audioCtx.currentTime+i*.1+.3);});}catch{}}
function celebrate(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const c=document.getElementById('confetti'),x=c.getContext('2d');c.width=innerWidth;c.height=innerHeight;let ps=Array.from({length:65},()=>({x:c.width/2,y:c.height*.65,vx:(Math.random()-.5)*12,vy:-Math.random()*12-3,color:Math.random()>.5?'#eabb64':'#74e6cc'})),n=0;function frame(){x.clearRect(0,0,c.width,c.height);ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.22;x.fillStyle=p.color;x.fillRect(Math.round(p.x),Math.round(p.y),6,6);});if(++n<110)requestAnimationFrame(frame);else x.clearRect(0,0,c.width,c.height);}frame();}
const archiveCharacters = new Image();
const explorerFrames = [
  [140, 7, 184, 467], [525, 10, 284, 464],
  [1004, 10, 248, 464], [1400, 5, 283, 469],
];
const tenFrames = [
  [128, 565, 192, 298], [565, 565, 201, 298],
  [972, 570, 269, 293], [1427, 570, 247, 293],
];
archiveCharacters.addEventListener('load', drawWorld);
archiveCharacters.src = 'assets/archive-characters.png';

function drawArchiveSprite(context, frame, center, floor, height) {
  if (!archiveCharacters.naturalWidth) return;
  const [left, top, width, sourceHeight] = frame;
  const displayWidth = Math.round(width * height / sourceHeight);
  context.drawImage(archiveCharacters, left, top, width, sourceHeight,
    Math.round(center - displayWidth / 2), floor - height, displayWidth, height);
}

const sceneBackdrops = {
  discovery: loadBackdrop('assets/desert-discovery.png'),
  archive: loadBackdrop('assets/grand-archive.png'),
};

function loadBackdrop(source) {
  const artwork = new Image();
  artwork.addEventListener('load', drawWorld);
  artwork.src = source;
  return artwork;
}

function drawWorld() {
  const canvas = document.getElementById('world');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  const discovery = state.stage === 0;
  const backdrop = discovery ? sceneBackdrops.discovery : sceneBackdrops.archive;
  const restored = state.solved.length;

  context.setTransform(canvas.width / 448, 0, 0, canvas.height / 160, 0, 0);
  context.imageSmoothingEnabled = false;
  context.fillStyle = '#102738';
  context.fillRect(0, 0, 448, 160);
  if (backdrop.naturalWidth) context.drawImage(backdrop, 0, 0, 448, 160);

  if (!discovery) drawArchiveLights(context, restored);

  const celebrating = correct || state.stage === 8;
  const heroX = discovery ? 46 : 95;
  const floor = discovery ? 141 : 143;
  const heroPose = celebrating ? 3 : discovery ? 1 : state.stage === 1 ? 0 : 2;
  const tenPose = celebrating ? 3 : discovery ? 0 : 2;
  drawArchiveSprite(context, explorerFrames[heroPose], heroX + 5, floor, 46);
  drawArchiveSprite(context, tenFrames[tenPose], heroX - 22, floor, 29);
}

function drawArchiveLights(context, restored) {
  const glow = state.color === 'amber' ? '#ffc75c' : '#7ce5c4';
  context.save();
  for (let index = 0; index < names.length - 1; index++) {
    const active = index < restored;
    const left = 196 + index * 8;
    context.fillStyle = '#171c20';
    context.fillRect(left - 1, 66, 6, 6);
    context.fillStyle = active ? glow : '#64604c';
    if (active) {
      context.shadowColor = glow;
      context.shadowBlur = 12;
    }
    context.fillRect(left, 67, 4, 4);
    context.shadowBlur = 0;
  }
  if (restored === 7) {
    const portal = context.createRadialGradient(222, 98, 3, 222, 98, 28);
    portal.addColorStop(0, '#e8fff2');
    portal.addColorStop(0.35, glow);
    portal.addColorStop(1, '#7ce5c400');
    context.fillStyle = portal;
    context.fillRect(194, 70, 56, 56);
  }
  context.restore();
}
applyColor();title();
