'use strict';

const byId = id => document.getElementById(id);
const deckKey = 'power-of-ten-scribe-deck-v1';
let dealt;
try {
  dealt = JSON.parse(localStorage.getItem(deckKey)) || {};
} catch {
  dealt = {};
}

let roomIndex = 0;
let codeIndex = 0;
const maxTorches = 3;
let torches = maxTorches;
let activeCode;
let accepting = false;
const doorBounds = [
  [68.5,26,14.8,57], [68.8,26,14.5,57], [68,27,16,56],
  [68.4,27,14.8,56], [68.9,26,14.6,57], [68.9,26,14.6,57],
];

function setTorches() {
  const hud = byId('torches');
  hud.hidden = false;
  hud.setAttribute('aria-label', torches + ' torches remaining');
  hud.querySelector('span').textContent = '◆ '.repeat(torches) + '◇ '.repeat(maxTorches - torches);
}

function start() {
  roomIndex = 0;
  codeIndex = 0;
  torches = maxTorches;
  byId('intro').hidden = true;
  openRoom();
}

function openRoom() {
  byId('result').hidden = true;
  byId('game').hidden = false;
  const scene = byId('scene');
  const [left, top, width, height] = doorBounds[roomIndex];
  scene.classList.remove('unlocked');
  scene.style.backgroundPosition = (roomIndex % 2 * 100) + '% ' + (Math.floor(roomIndex / 2) * 50) + '%';
  for (const [name, value] of Object.entries({left, top, width, height})) {
    scene.style.setProperty('--door-' + name, value + '%');
  }
  byId('room').textContent = chambers[roomIndex].name;
  setTorches();
  nextCode();
}

function nextCode() {
  const pool = roomIndex + ':' + codeIndex;
  const sequence = Number.isSafeInteger(dealt[pool]) && dealt[pool] >= 0 ? dealt[pool] : 0;
  activeCode = scribeCode(roomIndex, codeIndex, sequence);
  if (!activeCode) {
    showResult('Every code in this set has been used', 'You have reached the end of this chamber’s question bank on this browser.', false, false);
    byId('restart').hidden = true;
    return;
  }
  dealt[pool] = sequence + 1;
  localStorage.setItem(deckKey, JSON.stringify(dealt));
  byId('progress').textContent = (roomIndex < 5 ? 'Chamber ' + (roomIndex + 1) + ' of 5' : 'Secret chamber') + ' · Code ' + (codeIndex + 1) + ' of 5';
  byId('puzzle').hidden = false;
  byId('words').textContent = activeCode.words;
  byId('code-celebration').hidden = true;
  byId('hint').hidden = false;
  byId('puzzle').classList.remove('code-correct');
  byId('scene').classList.remove('code-correct');
  updateLocks();
  byId('feedback').textContent = 'TEN: Read the inscription, then enter the digits.';
  byId('next').hidden = true;
  byId('hint').disabled = false;
  byId('code').value = '';
  byId('code').disabled = false;
  byId('code-form').querySelector('button').disabled = false;
  accepting = true;
  byId('code').focus({preventScroll:true});
}

function prepareNext(label, action) {
  const next = byId('next');
  next.textContent = label;
  next.onclick = action;
  next.hidden = false;
  next.focus({preventScroll:true});
}

function checkCode(event) {
  event.preventDefault();
  if (!accepting) return;
  const input = byId('code');
  if (!input.value.trim()) {
    byId('feedback').textContent = 'TEN: Enter a code before checking it.';
    input.focus();
    return;
  }

  accepting = false;
  input.disabled = true;
  byId('code-form').querySelector('button').disabled = true;
  byId('hint').disabled = true;
  const entered = normalizeCode(input.value);
  const correct = entered === normalizeCode(activeCode.answer);
  const standard = activeCode.whole.toLocaleString('en-US') + (activeCode.fraction ? '.' + activeCode.fraction : '');

  if (!correct) {
    torches--;
    setTorches();
    const explanation = 'The correct code was ' + standard + '.';
    if (!torches) {
      showResult('The torches went out', explanation + ' Start from the first chamber with three torches and new inscriptions.', false, false);
    } else {
      byId('feedback').textContent = 'TEN: One torch went out. ' + explanation + ' ' + torches + (torches === 1 ? ' torch remains.' : ' torches remain.');
      prepareNext('Try a fresh code →', nextCode);
    }
    return;
  }

  codeIndex++;
  if (codeIndex < 5) {
    celebrateCode(standard);
    byId('feedback').textContent = 'TEN: ' + standard + ' is correct. ' + codeIndex + ' of 5 locks released.';
    prepareNext('Read the next inscription →', nextCode);
    return;
  }

  const restoredTorch = torches < maxTorches;
  if (restoredTorch) {
    torches++;
    setTorches();
  }
  celebrateCode(standard, restoredTorch);
  byId('scene').classList.add('unlocked');
  byId('feedback').textContent = 'TEN: All five codes are correct. The door is open! ' +
    (restoredTorch ? 'One torch restored. You now have ' + torches + ' torches.' : 'Your torches are already full.');
  prepareNext(roomIndex >= 4 ? 'Collect your seal →' : 'Enter the next chamber →', () => {
    if (roomIndex === 4) {
      localStorage.setItem('power-of-ten-master-scribe', 'earned');
      showResult('Master Scribe seal earned', 'You opened five chambers and solved codes into the billions.', true, true);
    } else if (roomIndex === 5) {
      localStorage.setItem('power-of-ten-secret-scribe', 'earned');
      showResult('Secret chamber cleared', 'You solved five more codes with billions and decimals.', true, false);
    } else {
      roomIndex++;
      codeIndex = 0;
      openRoom();
    }
  });
}

function updateLocks() {
  const locks = byId('locks');
  locks.setAttribute('aria-label', codeIndex + ' of 5 locks released');
  locks.querySelectorAll('span').forEach((lock, index) => {
    lock.classList.toggle('released', index < codeIndex);
  });
}

function celebrateCode(standard, restoredTorch = false) {
  const chamberCleared = codeIndex === 5;
  updateLocks();
  byId('celebration-title').textContent = chamberCleared ? 'Chamber unlocked!' : 'Correct code!';
  byId('celebration-detail').textContent = standard + ' · ' + codeIndex + ' of 5 locks released' + (restoredTorch ? ' · +1 torch restored' : '');
  byId('code-celebration').classList.toggle('chamber-cleared', chamberCleared);
  byId('code-celebration').hidden = false;
  byId('hint').hidden = true;
  byId('puzzle').classList.add('code-correct');
  byId('scene').classList.add('code-correct');
}

function showResult(title, message, reward, secret) {
  byId('game').hidden = true;
  byId('result').hidden = false;
  byId('result-title').textContent = title;
  byId('result-copy').textContent = message;
  byId('reward-art').hidden = !reward;
  byId('restart').hidden = false;
  byId('secret').hidden = !secret;
  byId('result-title').focus();
}

byId('begin').onclick = start;
byId('restart').onclick = start;
byId('code-form').addEventListener('submit', checkCode);
byId('hint').onclick = () => {
  const fraction = activeCode.fraction;
  byId('feedback').textContent = fraction
    ? 'TEN: Split at “and.” Write the whole number first, then the decimal point. ' + fractionalPlaces[fraction.length] + ' need ' + fraction.length + ' digit' + (fraction.length === 1 ? '' : 's') + ' after the point.'
    : 'TEN: Write each group in its place. Use zeros to hold any empty places between digits.';
};
byId('secret').onclick = () => {
  roomIndex = 5;
  codeIndex = 0;
  openRoom();
};
