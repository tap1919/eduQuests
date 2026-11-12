'use strict';

const byId = id => document.getElementById(id);
const targetHits = 16;
const skills = ['Place and digit value', 'Standard form', 'Expanded form', 'Powers of ten and zeros', 'Rounding'];
const questions = [
  {skill:0, prompt:'What place is the 7 in 43.728?', answer:'Tenths', options:['Hundreds','Tenths','Hundredths','Thousandths'], why:'The 7 is immediately to the right of the decimal point.'},
  {skill:0, prompt:'What is the value of the 6 in 58,614?', answer:'600', why:'The 6 is in the hundreds place, so its value is 6 × 100.'},
  {skill:0, prompt:'What place is the 4 in 6.084?', answer:'Thousandths', options:['Ones','Tenths','Hundredths','Thousandths'], why:'The 4 is three places to the right of the decimal point.'},
  {skill:0, prompt:'What is the value of the 3 in 8.037?', answer:'0.03', why:'The 3 is in the hundredths place, so it represents three hundredths.'},
  {skill:1, prompt:'Write “six thousand forty-two” in standard form.', answer:'6,042', why:'There are six thousands, no hundreds, four tens, and two ones.'},
  {skill:1, prompt:'Write “twenty-four and seven hundredths” in standard form.', answer:'24.07', why:'Seven hundredths is 0.07. The zero holds the tenths place.'},
  {skill:1, prompt:'Write “two million fifty thousand six” in standard form.', answer:'2,050,006', why:'The millions, thousands, and ones groups are 2, 050, and 006.'},
  {skill:1, prompt:'Write “one billion nine and four thousandths” in standard form.', answer:'1,000,000,009.004', why:'One billion nine is 1,000,000,009. Four thousandths adds 0.004.'},
  {skill:2, prompt:'Which expression is 6,042 in expanded form?', answer:'6,000 + 40 + 2', options:['600 + 40 + 2','6,000 + 400 + 2','6,000 + 40 + 2','6,000 + 4 + 2'], why:'The 6 contributes 6,000, the 4 contributes 40, and the 2 contributes 2.'},
  {skill:2, prompt:'Write 300 + 20 + 4 + 0.05 in standard form.', answer:'324.05', why:'The whole-number terms make 324. Five hundredths is 0.05.'},
  {skill:2, prompt:'Which expression is 42.306 in expanded form?', answer:'40 + 2 + 0.3 + 0.006', options:['40 + 2 + 0.03 + 0.006','40 + 2 + 0.3 + 0.06','40 + 2 + 0.3 + 0.006','4 + 2 + 0.3 + 0.006'], why:'The 3 contributes three tenths and the 6 contributes six thousandths.'},
  {skill:2, prompt:'Write 5,000,000 + 90,000 + 200 + 0.008 in standard form.', answer:'5,090,200.008', why:'Combine the whole-number terms to get 5,090,200, then add eight thousandths.'},
  {skill:3, prompt:'How many times as much is the 5 in 50 as the 5 in 5?', answer:'10', why:'Moving one place left makes a digit’s value ten times as large.'},
  {skill:3, prompt:'What is one tenth of 0.7?', answer:'0.07', why:'One tenth of seven tenths is seven hundredths.'},
  {skill:3, prompt:'In 4,005.08, what place does the zero immediately after the decimal point hold?', answer:'Tenths', options:['Ones','Hundreds','Tenths','Hundredths'], why:'The first digit to the right of the decimal is in the tenths place.'},
  {skill:3, prompt:'Which number is ten times as large as 0.036?', answer:'0.36', options:['0.0036','0.036','0.36','3.6'], why:'Multiplying by ten moves each digit one place left relative to the decimal.'},
  {skill:4, prompt:'Round 18.49 to the nearest whole number.', answer:'18', why:'The tenths digit is 4, so keep the ones digit.'},
  {skill:4, prompt:'Round 4.382 to the nearest tenth.', answer:'4.4', why:'The hundredths digit is 8, so increase the tenths digit from 3 to 4.'},
  {skill:4, prompt:'Round 6.243 to the nearest hundredth.', answer:'6.24', why:'The thousandths digit is 3, so keep the hundredths digit.'},
  {skill:4, prompt:'Round 9.96 to the nearest tenth.', answer:'10.0', why:'The hundredths digit is 6. Increasing nine tenths by one tenth carries into the ones place.'},
];

let index = 0;
let attempts = [];
let correctCount = 0;
let locked = false;

function shuffle(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i],copy[j]] = [copy[j],copy[i]];
  }
  return copy;
}

function updateBattle() {
  const remaining = Math.max(0, targetHits - correctCount);
  byId('wards').value = remaining;
  byId('ward-count').textContent = remaining + ' / ' + targetHits;
  byId('hits').textContent = correctCount;
  byId('counters').textContent = attempts.length - correctCount;
}

function startBattle() {
  index = 0;
  attempts = [];
  correctCount = 0;
  byId('intro').hidden = true;
  byId('results').hidden = true;
  byId('battle').hidden = false;
  byId('count').hidden = false;
  showQuestion();
}

function showQuestion() {
  locked = false;
  const question = questions[index];
  byId('count').textContent = 'Question ' + (index + 1) + ' of ' + questions.length;
  byId('arena').className = 'boss-arena';
  byId('skill').textContent = skills[question.skill];
  byId('prompt').textContent = question.prompt;
  byId('battle-feedback').textContent = '';
  byId('battle-feedback').className = '';
  byId('attack').hidden = false;
  byId('next').hidden = true;
  byId('answer').value = '';
  byId('answer').disabled = false;
  byId('entry').hidden = Boolean(question.options);
  const options = byId('choices');
  options.replaceChildren();
  if (question.options) {
    for (const value of shuffle(question.options)) {
      const label = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'choice';
      radio.value = value;
      label.append(radio, document.createTextNode(value));
      options.append(label);
    }
  }
  updateBattle();
  byId('prompt').focus({preventScroll:true});
}

byId('attack-form').addEventListener('submit', event => {
  event.preventDefault();
  if (locked) return;
  const question = questions[index];
  const choice = byId('choices').querySelector('input:checked');
  const submitted = question.options ? choice?.value : byId('answer').value.trim();
  const feedback = byId('battle-feedback');
  const number = !question.options && submitted ? normalizeCode(submitted) : null;
  if (!submitted || (!question.options && number === null)) {
    feedback.textContent = question.options ? 'Choose an answer before attacking.' : 'Enter a number using digits and a decimal point if needed.';
    return;
  }

  locked = true;
  const correct = question.options ? submitted === question.answer : number === normalizeCode(question.answer);
  attempts.push({submitted, correct});
  if (correct) correctCount++;
  updateBattle();
  byId('arena').classList.add(correct ? 'hero-hit' : 'mummy-hit');
  feedback.className = correct ? 'hit-feedback' : 'counter-feedback';
  feedback.textContent = correct ? '✦ Hit landed! Correct answer.' : 'The mummy countered. This answer was incorrect.';
  if (correctCount === targetHits && correct) {
    feedback.textContent = '✦ All mummy wards are broken!' +
      (index + 1 < questions.length ? ' Finish the remaining questions.' : '');
  }
  byId('answer').disabled = true;
  byId('choices').querySelectorAll('input').forEach(input => {input.disabled = true;});
  byId('attack').hidden = true;
  const next = byId('next');
  next.textContent = index + 1 === questions.length ? 'See battle results →' : 'Next question →';
  next.hidden = false;
  next.focus({preventScroll:true});
});

function showResults() {
  const victory = correctCount >= targetHits;
  byId('battle').hidden = true;
  byId('results').hidden = false;
  byId('arena').className = 'boss-arena' + (victory ? ' mummy-defeated' : '');
  byId('result-title').textContent = victory ? 'Mummy defeated!' : 'The mummy holds the tomb';
  byId('score').textContent = correctCount + ' / ' + questions.length + ' correct · ' + Math.round(correctCount / questions.length * 100) + '%';
  byId('result-copy').textContent = victory ? 'You earned the Guardian of Ten seal.' : 'Land at least 16 hits to win. Review your answers and try another battle.';
  if (victory) {
    try { localStorage.setItem('power-of-ten-guardian-of-ten','earned'); } catch {}
  }
  byId('skill-scores').replaceChildren(...skills.map((skill, skillIndex) => {
    const total = questions.filter(question => question.skill === skillIndex).length;
    const score = attempts.filter((attempt, i) => attempt.correct && questions[i].skill === skillIndex).length;
    const item = document.createElement('div');
    item.textContent = skill + ' · ' + score + ' / ' + total;
    return item;
  }));
  byId('review').open = false;
  byId('review-list').replaceChildren(...questions.map((question,i) => {
    const item = document.createElement('li');
    const attempt = attempts[i];
    const title = document.createElement('strong');
    const explanation = document.createElement('p');
    title.textContent = (attempt.correct ? '✓ ' : '✗ ') + question.prompt;
    explanation.textContent = 'Your answer: ' + attempt.submitted + ' · Correct answer: ' + question.answer + '. ' + question.why;
    item.append(title,explanation);
    return item;
  }));
  byId('result-title').focus();
}

byId('begin').onclick = startBattle;
byId('replay').onclick = startBattle;
byId('next').onclick = () => {
  index++;
  if (index === questions.length) showResults();
  else showQuestion();
};
