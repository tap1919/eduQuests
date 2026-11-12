'use strict';

// Every slot has its own number range or decimal scale. The first 100 codes
// in each slot form a 3,000-question bank across the six chambers.
const smallWords = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const tensWords = ['', '', 'twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
const fractionalPlaces = ['','tenths','hundredths','thousandths'];

function wholeWords(number) {
  if (number < 20) return smallWords[number];
  if (number < 100) return tensWords[Math.floor(number / 10)] + (number % 10 ? '-' + smallWords[number % 10] : '');
  for (const [power, name] of [[1e9,'billion'], [1e6,'million'], [1e3,'thousand'], [100,'hundred']]) {
    if (number >= power) {
      const remainder = number % power;
      return wholeWords(Math.floor(number / power)) + ' ' + name + (remainder ? ' ' + wholeWords(remainder) : '');
    }
  }
}

const chambers = [
  {name:'The Broken Tablet', pools: [
    [100,180],[280,180],[460,180],[640,180,'4'],[820,180,'08'],
  ]},
  {name:'The Silent Columns', pools: [
    [1001,600],[3001,600],[10001,900],[40001,900,'06'],[100001,900,'007'],
  ]},
  {name:'The Split Door', pools: [
    [10,100,'4'],[120,100,'6'],[1000,180,'2'],[10000,200,'7'],[100000,250,'9'],
  ]},
  {name:'The Reflecting Pool', pools: [
    [10,100,'08'],[120,100,'04'],[1000,180,'07'],[10000,200,'062'],[100000,250,'009'],
  ]},
  {name:'The Scribe’s Vault', pools: [
    [1000000,700],[10000000,900],[100000000,1000],[1000000000,1200,'6'],[4000000000,1500,'038'],
  ]},
  {name:'The Secret Room', pools: [
    [5000000000,1000,'04'],[6000000000,1000,'008'],[7000000000,1000,'072'],[8000000000,1000,'096'],[9000000000,1000,'405'],
  ]},
];

function scribeCode(room, slot, sequence) {
  const [start, count, fraction] = chambers[room].pools[slot];
  if (sequence >= count) return null;
  // Visit the range once without replacement, starting away from round numbers.
  const whole = start + ((sequence + 37 + slot * 19) % count);
  const numerator = Number(fraction);
  const unit = fraction ? fractionalPlaces[fraction.length] : '';
  const words = wholeWords(whole) + (fraction ? ' and ' + wholeWords(numerator) + ' ' + (numerator === 1 ? unit.slice(0,-1) : unit) : '');
  return {whole, fraction, words:words[0].toUpperCase() + words.slice(1), answer:String(whole) + (fraction ? '.' + fraction : '')};
}

function normalizeCode(value) {
  const trimmed = value.trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(trimmed)) return null;
  const [whole, fraction = ''] = trimmed.replaceAll(',', '').split('.');
  const integer = whole.replace(/^0+(?=\d)/, '');
  const decimal = fraction.replace(/0+$/, '');
  return integer + (decimal ? '.' + decimal : '');
}
