'use strict';

const element = id => document.getElementById(id);
const canvas = element('course');
const context = canvas.getContext('2d');
const quiz = element('crystal-quiz');
const stageWidth = 600;
const floorY = 310;
const speed = 270;
const gravity = 1220;
const jumpSpeed = 545;
const rooms = [
  {gap:112, rise:26, places:0, examples:[426,764,350,849]},
  {gap:118, rise:36, places:0, examples:[12501,18949,9950,2499]},
  {gap:123, rise:42, hazard:'lift', places:1, examples:[4382,3746,2650,6044]},
  {gap:129, rise:51, hazard:'crumble', places:1, examples:[9960,9995,12999,9950]},
  {gap:136, rise:58, hazard:'dart', places:2, examples:[6243,7351,6045,4104]},
  {gap:145, rise:66, places:2, examples:[2995,9996,45,10995]},
];

const backdrop = new Image();
backdrop.src = 'assets/falling-tunnel.png';
const sprites = new Image();
sprites.src = 'assets/archive-characters.png';
const idleFrame = [140,7,184,467];
const walkFrame = [525,10,284,464];
const blocks = rooms.flatMap((room, index) => {
  const start = index * stageWidth;
  const landing = 220 + room.gap;
  return [
    {left:start, right:start+220, y:floorY},
    {left:start+landing, right:start+474, y:floorY-room.rise, baseY:floorY-room.rise, hazard:room.hazard, crumbleAt:null},
    {left:start+474, right:start+stageWidth, y:floorY},
  ];
});
const hero = {x:60,y:floorY,vy:0,grounded:true,facing:1};
const heldKeys = new Set();
const heldPointers = new Map();
let questions = [];
let lit = 0;
let spills = 0;
let checkpoint = {x:60,y:floorY};
let running = false;
let jumpRequested = false;
let frameId = 0;
let previousTime;
let activeQuestion;
let quizSolved = false;
let courseTime = 0;
let lastNotice = -1;
const collapseDelay = 0.65;
const collapseReset = 2.1;

function roundingQuestion(room) {
  const value = room.examples[Math.floor(Math.random() * room.examples.length)];
  const step = 10 ** (3 - room.places);
  const base = Math.floor(value / step);
  const rounded = base + (value % step >= step / 2 ? 1 : 0);
  const digit = Math.floor(value / (step / 10)) % 10;
  return {
    shown: (value / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, ''),
    target: ['whole number','tenth','hundredth'][room.places],
    answer: (rounded / 10 ** room.places).toFixed(room.places),
    digit,
  };
}

function setStatus(text) {
  element('course-status').textContent = 'TEN: ' + text;
}

function clearControls() {
  heldKeys.clear();
  heldPointers.clear();
  jumpRequested = false;
}

function start() {
  lit = 0;
  spills = 0;
  courseTime = 0;
  lastNotice = -1;
  for (const block of blocks) {
    if (block.baseY !== undefined) block.y = block.baseY;
    block.crumbleAt = null;
  }
  questions = rooms.map(roundingQuestion);
  checkpoint = {x:60,y:floorY};
  Object.assign(hero, checkpoint, {vy:0,grounded:true,facing:1,surface:null});
  element('intro').hidden = true;
  element('finish').hidden = true;
  element('play').hidden = false;
  element('crystal-count').textContent = '0 / ' + rooms.length;
  setStatus('Jump over the green poison, then touch the first crystal.');
  running = true;
  resumeLoop();
}

function resumeLoop() {
  previousTime = undefined;
  clearControls();
  canvas.focus({preventScroll:true});
  cancelAnimationFrame(frameId);
  frameId = requestAnimationFrame(tick);
}

function tick(now) {
  const dt = previousTime === undefined ? 0 : Math.min((now - previousTime) / 1000, 0.025);
  previousTime = now;
  moveHero(dt);
  draw(now);
  if (running && !quiz.open) frameId = requestAnimationFrame(tick);
}

function moveHero(dt) {
  courseTime += dt;
  for (const block of blocks) {
    if (block.hazard === 'lift') {
      const previousY = block.y;
      block.y = block.baseY + Math.sin(courseTime * 1.9) * 23;
      if (hero.grounded && hero.surface === block) hero.y += block.y - previousY;
    }
    if (block.crumbleAt !== null && courseTime >= block.crumbleAt + collapseReset) block.crumbleAt = null;
  }
  const directions = [...heldPointers.values()];
  const left = heldKeys.has('ArrowLeft') || heldKeys.has('a') || directions.includes(-1);
  const right = heldKeys.has('ArrowRight') || heldKeys.has('d') || directions.includes(1);
  const direction = Number(right) - Number(left);
  if (direction) hero.facing = direction;
  if (jumpRequested && hero.grounded) {
    hero.vy = -jumpSpeed;
    hero.grounded = false;
  }
  jumpRequested = false;

  const gate = lit < rooms.length ? lit * stageWidth + 550 : rooms.length * stageWidth - 22;
  hero.x = Math.max(16, Math.min(gate - 12, hero.x + direction * speed * dt));
  const oldY = hero.y;
  hero.vy += gravity * dt;
  hero.y += hero.vy * dt;
  hero.grounded = false;
  hero.surface = null;

  for (const block of blocks) {
    if (isCollapsed(block)) continue;
    if (hero.vy >= 0 && oldY <= block.y && hero.y >= block.y &&
      hero.x + 7 > block.left && hero.x - 7 < block.right) {
      hero.y = block.y;
      hero.vy = 0;
      hero.grounded = true;
      hero.surface = block;
      if (block.hazard === 'crumble' && block.crumbleAt === null) {
        block.crumbleAt = courseTime + collapseDelay;
        setStatus('That ledge is cracking! Keep moving.');
      }
      break;
    }
  }

  if (hero.y >= 342) {
    respawn('Poison pool! Back at your checkpoint. Jump from closer to the edge.');
    return;
  }

  const section = Math.floor(hero.x / stageWidth);
  const hazard = rooms[section].hazard;
  if (section !== lastNotice) {
    lastNotice = section;
    if (hazard === 'lift') setStatus('Watch the moving ledge. Jump when it is lower.');
    if (hazard === 'crumble') setStatus('Cracked stones collapse soon after you land. Keep moving.');
    if (hazard === 'dart') setStatus('Watch the bronze launcher. When it flashes, get ready to jump.');
  }
  if (hazard === 'dart') {
    const dart = dartState(section);
    if (dart.flying && Math.abs(hero.x - dart.x) < 20 &&
        dart.y < hero.y - 4 && dart.y > hero.y - 57) {
      respawn('Poison dart! Back at your checkpoint. Jump when the launcher flashes.');
      return;
    }
  }

  if (lit === rooms.length) {
    if (hero.x >= gate - 13 && hero.grounded) finish();
    return;
  }

  const crystalX = lit * stageWidth + 416;
  const ledge = blocks[lit * 3 + 1];
  const crystalY = ledge.y;
  if (!isCollapsed(ledge) && Math.abs(hero.x - crystalX) < 27 && Math.abs(hero.y - crystalY) < 19) openQuiz();
  else if (right && hero.x === gate - 12) setStatus('This gate opens when you light the crystal on the stone ledge.');
}

function respawn(message) {
  spills++;
  Object.assign(hero, checkpoint, {vy:0,grounded:true,surface:null});
  clearControls();
  setStatus(message);
}

function isCollapsed(block) {
  return block.crumbleAt !== null && courseTime >= block.crumbleAt;
}

function dartState(section) {
  const phase = courseTime % 3.4;
  const launcherX = section * stageWidth + 209;
  const flying = phase >= 1.75 && phase < 2.25;
  return {launcherX, warning:phase >= 1 && phase < 1.75, flying,
    x:launcherX-(phase-1.75)*384, y:floorY-31};
}

function drawDart(section, camera) {
  const dart = dartState(section);
  context.fillStyle = dart.warning ? '#ffe275' : '#98703e';
  context.fillRect(dart.launcherX-camera-9,dart.y-9,18,18);
  context.fillStyle = dart.warning ? '#ab3f22' : '#231b13';
  context.fillRect(dart.launcherX-camera-6,dart.y-2,10,4);
  if (!dart.flying) return;
  context.fillStyle = '#85ed56';
  context.fillRect(dart.x-camera-10,dart.y-2,20,4);
  context.fillStyle = '#efffa6';
  context.fillRect(dart.x-camera-11,dart.y-3,4,6);
}

function draw(now) {
  const camera = Math.max(0, Math.min(rooms.length * stageWidth - canvas.width, hero.x - canvas.width * 0.34));
  context.imageSmoothingEnabled = false;
  context.fillStyle = '#111b29';
  context.fillRect(0,0,canvas.width,canvas.height);
  if (backdrop.naturalWidth) {
    const offset = (camera * 0.24) % canvas.width;
    for (const x of [-offset,canvas.width-offset]) {
      context.drawImage(backdrop,0,0,backdrop.width,backdrop.height*0.88,x,0,canvas.width,355);
    }
  }

  for (const [index,room] of rooms.entries()) {
    const origin = index * stageWidth - camera;
    if (origin > canvas.width || origin + stageWidth < 0) continue;
    const ledge = blocks[index * 3 + 1];
    const floating = room.hazard === 'lift' || room.hazard === 'crumble';
    drawPoison(origin + 220, floating ? 254 : room.gap, now);
    if (!isCollapsed(ledge)) drawCrystal(origin + 416, ledge.y - 20, index < lit, now);
    if (room.hazard === 'dart') drawDart(index,camera);
    if (index >= lit) drawGate(origin + 550);
  }
  for (const block of blocks) {
    if (isCollapsed(block)) continue;
    const floating = block.hazard === 'lift' || block.hazard === 'crumble';
    const x = block.left-camera;
    drawStone(x,block.y,block.right-block.left,floating ? 27 : canvas.height-block.y);
    if (block.hazard === 'crumble') {
      context.fillStyle = block.crumbleAt === null ? '#301e17' : '#ffe484';
      for (let offset=14;offset<block.right-block.left-6;offset+=29) {
        context.fillRect(x+offset,block.y+3,3,8);
        context.fillRect(x+offset+3,block.y+10,5,3);
        context.fillRect(x+offset+7,block.y+12,2,8);
      }
    }
  }
  drawExplorer(hero.x-camera,hero.y);
  if (lit === rooms.length) {
    context.fillStyle = '#f4cd78';
    context.font = 'bold 20px system-ui';
    context.fillText('EXIT →', rooms.length*stageWidth - camera - 140, floorY - 22);
  }
}

function drawStone(x,y,width,depth) {
  if (x > canvas.width || x + width < 0) return;
  context.fillStyle = '#68492d';
  context.fillRect(x,y,width,depth);
  if (backdrop.naturalWidth) {
    for (let offset = 0; offset < width; offset += 120) {
      const length = Math.min(120,width-offset);
      context.drawImage(backdrop,370,backdrop.height*0.89,480*length/120,backdrop.height*0.10,x+offset,y,length,Math.min(45,depth));
    }
  }
  context.fillStyle = '#d0a66f';
  context.fillRect(x,y,width,3);
}

function drawPoison(x,width,now) {
  context.fillStyle = '#192019';
  context.fillRect(x,floorY,width,canvas.height-floorY);
  context.fillStyle = '#367f37';
  context.fillRect(x,342,width,33);
  context.fillStyle = '#a9dc57';
  context.fillRect(x,341,width,3);
  for(let index=0;index<5;index++) {
    const phase=(now/23+index*11)%28;
    context.fillStyle = index%2 ? '#8bc449' : '#69a747';
    context.fillRect(x+9+index*(width-16)/5,367-phase,4,4);
  }
}

function drawCrystal(x,y,cleared,now) {
  context.save();
  context.translate(x,y + (cleared ? 0 : Math.sin(now/260)*4));
  context.shadowColor = cleared ? '#f1c962' : '#66ffe5';
  context.shadowBlur = 18;
  context.fillStyle = cleared ? '#efc66b' : '#59e5d1';
  context.beginPath();
  context.moveTo(0,-17);context.lineTo(13,-4);context.lineTo(10,11);
  context.lineTo(0,18);context.lineTo(-10,11);context.lineTo(-13,-4);
  context.closePath();context.fill();
  context.shadowBlur = 0;
  context.fillStyle = '#fff9cd';
  context.fillRect(-2,-10,4,16);
  context.restore();
}

function drawGate(x) {
  context.fillStyle = '#754d31';
  context.fillRect(x-8,188,16,122);
  context.fillStyle = '#c7a464';
  context.fillRect(x-11,186,22,6);
  context.fillStyle = '#ffe185';
  context.fillRect(x-2,195,4,106);
}

function drawExplorer(x,y) {
  if (!sprites.naturalWidth) return;
  const moving = heldKeys.size || heldPointers.size || !hero.grounded;
  const [sx,sy,sw,sh] = moving ? walkFrame : idleFrame;
  const height = 67;
  const width = sw * height / sh;
  context.save();
  context.translate(x,y);
  context.scale(hero.facing,1);
  context.drawImage(sprites,sx,sy,sw,sh,-width/2,-height,width,height);
  context.restore();
}

function openQuiz() {
  clearControls();
  quizSolved = false;
  activeQuestion = questions[lit];
  element('quiz-stage').textContent = 'Crystal ' + (lit + 1) + ' of ' + rooms.length;
  element('question').textContent = 'Round ' + activeQuestion.shown + ' to the nearest ' + activeQuestion.target + '.';
  element('round-answer').value = '';
  element('round-answer').disabled = false;
  element('check-round').hidden = false;
  element('round-hint').hidden = false;
  element('resume').hidden = true;
  element('quiz-feedback').textContent = '';
  element('quiz-feedback').classList.remove('correct');
  quiz.showModal();
  element('round-answer').focus();
}

function clue() {
  return 'TEN: The digit just to the right of the ' + activeQuestion.target + ' place is ' +
    activeQuestion.digit + '. ' + (activeQuestion.digit < 5 ? 'Keep the rounding digit.' : 'Increase the rounding digit by one. Carry if needed.');
}

element('round-form').addEventListener('submit', event => {
  event.preventDefault();
  if (quizSolved) return;
  const answer = element('round-answer').value.trim();
  const feedback = element('quiz-feedback');
  if (!/^\d+(?:\.\d+)?$/.test(answer)) {
    feedback.textContent = 'Enter a number using digits.';
    return;
  }
  if (Number(answer) !== Number(activeQuestion.answer)) {
    feedback.textContent = 'Try again. ' + clue();
    return;
  }
  quizSolved = true;
  checkpoint = {x:lit*stageWidth+502,y:floorY};
  lit++;
  element('crystal-count').textContent = lit + ' / ' + rooms.length;
  feedback.textContent = '◆ Crystal lit! ' + activeQuestion.shown + ' rounds to ' + activeQuestion.answer + '. Checkpoint saved.';
  feedback.classList.add('correct');
  element('round-answer').disabled = true;
  element('check-round').hidden = true;
  element('round-hint').hidden = true;
  element('resume').hidden = false;
  draw(performance.now());
  element('resume').focus();
});

quiz.addEventListener('cancel',event => event.preventDefault());
element('round-hint').onclick = () => { element('quiz-feedback').textContent = clue(); };
element('resume').onclick = () => {
  quiz.close();
  setStatus(lit === rooms.length ? 'All crystals lit! Walk through the exit.' : 'Gate open. Keep going to the next crystal.');
  resumeLoop();
};

function finish() {
  running = false;
  clearControls();
  try { localStorage.setItem('power-of-ten-crystal-pathfinder','earned'); } catch {}
  element('play').hidden = true;
  element('finish').hidden = false;
  element('run-summary').textContent = '6 rounding crystals lit · ' + spills + (spills === 1 ? ' poison hit' : ' poison hits');
  element('finish-title').focus();
}

const movementKeys = ['ArrowLeft','ArrowRight','a','d','ArrowUp','w',' '];
window.addEventListener('keydown',event => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (!running || quiz.open || !movementKeys.includes(key) ||
      !element('play').contains(document.activeElement) || event.altKey || event.ctrlKey || event.metaKey) return;
  if (key === ' ' && document.activeElement.tagName === 'BUTTON') return;
  event.preventDefault();
  if (key === 'ArrowUp' || key === 'w' || key === ' ') {
    if (!event.repeat) jumpRequested = true;
  } else heldKeys.add(key);
});
window.addEventListener('keyup',event => heldKeys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key));
window.addEventListener('blur',clearControls);
for (const [id,direction] of [['move-left',-1],['move-right',1]]) {
  const button = element(id);
  button.addEventListener('pointerdown',event => {
    button.setPointerCapture(event.pointerId);
    heldPointers.set(event.pointerId,direction);
  });
  for (const event of ['pointerup','pointercancel','lostpointercapture']) {
    button.addEventListener(event,pointer => heldPointers.delete(pointer.pointerId));
  }
  button.addEventListener('click',event => {
    if (event.detail === 0) {
      heldPointers.set(id,direction);
      setTimeout(() => heldPointers.delete(id),130);
    }
  });
}
element('jump').onclick = () => { jumpRequested = true; };
element('begin').onclick = start;
element('replay').onclick = start;
