'use strict';

const find = id => document.getElementById(id);
const places = ['Thousands', 'Hundreds', 'Tens', 'Ones', 'Tenths', 'Hundredths', 'Thousandths'];
const examples = [
  ['4,582.736', 5, [4, 1]], ['643.25', 1, [5, 2]],
  ['19.486', 4, [5, 6]], ['5,321.84', 2, [3, 4]],
  ['7,406.291', 6, [0, 5]], ['2,895.613', 1, [5, 2]],
  ['865.407', 5, [1, 4]], ['39.602', 3, [2, 6]],
  ['1,247.905', 0, [6, 1]], ['76.543', 4, [2, 5]],
  ['9,084.123', 2, [4, 1]], ['5,071.008', 6, [5, 0]],
];
const positionHints = [
  'four places to the left of the decimal point',
  'three places to the left of the decimal point',
  'two places to the left of the decimal point',
  'immediately to the left of the decimal point',
  'immediately to the right of the decimal point',
  'two places to the right of the decimal point',
  'three places to the right of the decimal point',
];
const badgeKey = 'power-of-ten-stonebreaker';
let roundIndex = 0;
let streak = 0;
let best = 0;
let misses = 0;
let animation = 0;
let accepting = false;
let untimed = false;
let options = [];
let fallDistance = 0;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function showBrief() {
  find('brief').hidden = false;
  find('challenge').hidden = true;
  find('result').hidden = true;
  find('earned').hidden = !localStorage.getItem(badgeKey);
}

function startRun() {
  roundIndex = 0;
  streak = 0;
  best = 0;
  misses = 0;
  untimed = find('untimed').checked;
  find('brief').hidden = true;
  find('challenge').hidden = false;
  beginRound();
}

function beginRound() {
  cancelAnimationFrame(animation);
  const [number, place, distractors] = examples[roundIndex];
  const practice = roundIndex < 2;
  const rightLane = (roundIndex * 2 + 2) % 3;
  options = distractors.slice();
  options.splice(rightLane, 0, place);
  const decimal = number.indexOf('.');
  const positions = [...number].map((char, index) => /\d/.test(char) ? index : -1).filter(index => index >= 0);
  const wholeCount = positions.filter(index => index < decimal).length;
  const highlight = positions[place - (4 - wholeCount)];
  find('number').innerHTML = number.slice(0, highlight) + '<mark>' + number[highlight] + '</mark>' + number.slice(highlight + 1);
  find('number').setAttribute('aria-label', number + ', highlighted digit ' + number[highlight]);
  find('round').textContent = practice ? 'Practice ' + (roundIndex + 1) + '/2' : (roundIndex - 1) + '/10';
  find('streak').textContent = streak;
  find('best').textContent = best;
  find('advance').hidden = true;
  find('hero').className = 'tunnel-hero';
  find('hero').style.removeProperty('--hero-lane');
  find('feedback').textContent = practice ? 'TEN: Take your time. Use the decimal point to find the place.' : 'TEN: Clear the boulder with the correct place name.';
  find('boulders').replaceChildren(...options.map((option, lane) => {
    const button = document.createElement('button');
    button.className = 'boulder';
    button.textContent = places[option];
    button.setAttribute('aria-keyshortcuts', String(lane + 1));
    button.onclick = () => answer(lane);
    return button;
  }));
  find('time-track').hidden = practice || untimed;
  find('time-left').style.width = '100%';
  fallDistance = 0;
  accepting = true;
  find('boulders').firstElementChild.focus({preventScroll:true});
  if (!practice && !untimed) animateDrop();
}

function animateDrop() {
  const duration = Math.max(3300, 7800 - (roundIndex - 2) * 500);
  const readTime = 1400;
  const started = performance.now();
  const tunnel = find('tunnel');
  const boulders = [...find('boulders').children];
  function frame(now) {
    if (!accepting) return;
    const fraction = Math.min(1, Math.max(0, (now - started - readTime) / duration));
    fallDistance = fraction * Math.max(0, tunnel.clientHeight * 0.88 - boulders[0].offsetHeight - 14);
    find('time-left').style.width = (100 * (1 - fraction)) + '%';
    if (!reducedMotion.matches) {
      boulders.forEach(boulder => boulder.style.setProperty('--fall', fallDistance + 'px'));
    }
    if (fraction === 1) answer(-1);
    else animation = requestAnimationFrame(frame);
  }
  animation = requestAnimationFrame(frame);
}

function answer(lane) {
  if (!accepting) return;
  accepting = false;
  cancelAnimationFrame(animation);
  const place = examples[roundIndex][1];
  const practice = roundIndex < 2;
  const correct = options[lane] === place;
  const buttons = [...find('boulders').children];
  buttons.forEach(button => button.disabled = true);
  const advance = find('advance');

  if (correct) {
    if (!practice) {
      streak++;
      best = Math.max(best, streak);
    }
    buttons[lane].classList.add('broken');
    find('hero').style.setProperty('--hero-lane', ((lane + 0.5) / 3 * 100) + '%');
    find('hero').classList.add('safe');
    find('feedback').textContent = 'TEN: Path clear! ' + places[place] + ' is ' + positionHints[place] + '.';
    advance.textContent = roundIndex === 1 ? 'Begin the challenge →' : roundIndex === examples.length - 1 ? 'Claim your badge →' : 'Next seal →';
    advance.onclick = () => {
      roundIndex++;
      if (roundIndex === examples.length) finishRun();
      else beginRound();
    };
  } else {
    if (!practice) {
      misses++;
      streak = 0;
    }
    if (lane >= 0) buttons[lane].classList.add('missed');
    find('hero').classList.add('duck');
    const mistake = lane < 0 ? 'Time ran out. ' : places[options[lane]] + ' is ' + positionHints[options[lane]] + '. ';
    find('feedback').textContent = 'TEN: ' + mistake + 'Count from the decimal point toward the highlighted digit.';
    advance.textContent = 'Try this seal again →';
    advance.onclick = beginRound;
  }
  find('streak').textContent = streak;
  find('best').textContent = best;
  advance.hidden = false;
  advance.focus({preventScroll:true});
}

function finishRun() {
  localStorage.setItem(badgeKey, 'earned');
  find('challenge').hidden = true;
  find('result').hidden = false;
  find('result-summary').textContent = '10 seals cleared · Best streak: ' + best + ' · Retries: ' + misses;
  find('result-title').focus();
}

document.addEventListener('keydown', event => {
  if (!accepting || event.repeat || !/^[123]$/.test(event.key)) return;
  event.preventDefault();
  answer(Number(event.key) - 1);
});
find('begin').onclick = startRun;
find('replay').onclick = () => {
  showBrief();
  find('begin').focus();
};
showBrief();
