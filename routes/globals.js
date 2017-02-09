const router = require('express').Router();
const nconf = require('nconf');
const fs = require('fs');
const path = require('path');

const testSet = require('../lib/testSet');
const Output = require('../lib/testOutput');

const winston = require('winston');
const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      'timestamp': true,
      'colorize': true
    })
  ]
});

const getUniqueLPs = require('../lib/utils').getUniqueLPs;

router.use('/', function (req, res, next) {
  res.locals.defaultLP = nconf.get('OpenNMTBenchmark:default:LP');
  res.locals.locale = nconf.get('OpenNMTBenchmark:default:locale');
  res.locals.c2l = c2l;
  res.locals.visitor = req.user || '';
  next();
});

module.exports = router;

/**
 * Retrieve language pair list from available test files
 *
 * @params response object
 *
 * @return Promise
 *
 */
function getLanguagePairs (res) {
  return new Promise(function (resolve, reject) {
    testSet.getTestSets(function (err, data) {
      if (err) {
        res.locals.languagePairs = [];
        reject('Unable to retrieve test sets: ' + err);
      } else {
        res.locals.languagePairs = getUniqueLPs(data);
        resolve();
      }
    });
  });
}

const c2l = {
  aa: 'Afar',
  ab: 'Abkhaz',
  ae: 'Avestan',
  af: 'Afrikaans',
  ak: 'Akan',
  am: 'Amharic',
  an: 'Aragonese',
  ar: 'Arabic',
  as: 'Assamese',
  av: 'Avaric',
  ay: 'Aymara',
  az: 'Azerbaijani',
  ba: 'Bashkir',
  be: 'Belarusian',
  bg: 'Bulgarian',
  bh: 'Bihari',
  bi: 'Bislama',
  bm: 'Bambara',
  bn: 'Bengali',
  bo: 'Tibetan Standard',
  br: 'Brazilian portuguese',
  bs: 'Bosnian',
  ca: 'Catalan',
  ce: 'Chechen',
  ch: 'Chamorro',
  co: 'Corsican',
  cr: 'Cree',
  cs: 'Czech',
  cu: 'Old Church Slavonic',
  cv: 'Chuvash',
  cy: 'Welsh',
  da: 'Danish',
  de: 'German',
  dv: 'Divehi',
  dz: 'Dzongkha',
  ee: 'Ewe',
  el: 'Greek',
  en: 'English',
  eo: 'Esperanto',
  es: 'Spanish',
  et: 'Estonian',
  eu: 'Basque',
  fa: 'Persian',
  ff: 'Fula',
  fi: 'Finnish',
  fj: 'Fijian',
  fo: 'Faroese',
  fr: 'French',
  fy: 'Western Frisian',
  ga: 'Irish',
  gd: 'Scottish Gaelic',
  gl: 'Galician',
  gn: 'Guaraní',
  gu: 'Gujarati',
  gv: 'Manx',
  ha: 'Hausa',
  he: 'Hebrew',
  hi: 'Hindi',
  ho: 'Hiri Motu',
  hr: 'Croatian',
  ht: 'Haitian',
  hu: 'Hungarian',
  hy: 'Armenian',
  hz: 'Herero',
  ia: 'Interlingua',
  id: 'Indonesian',
  ie: 'Interlingue',
  ig: 'Igbo',
  ii: 'Nuosu',
  ik: 'Inupiaq',
  io: 'Ido',
  is: 'Icelandic',
  it: 'Italian',
  iu: 'Inuktitut',
  ja: 'Japanese',
  jv: 'Javanese',
  ka: 'Georgian',
  kg: 'Kongo',
  ki: 'Kikuyu',
  kj: 'Kwanyama',
  kk: 'Kazakh',
  kl: 'Kalaallisut',
  km: 'Khmer',
  kn: 'Kannada',
  ko: 'Korean',
  kr: 'Kanuri',
  ks: 'Kashmiri',
  ku: 'Kurdish',
  kv: 'Komi',
  kw: 'Cornish',
  ky: 'Kyrgyz',
  la: 'Latin',
  lb: 'Luxembourgish',
  lg: 'Ganda',
  li: 'Limburgish',
  ln: 'Lingala',
  lo: 'Lao',
  lt: 'Lithuanian',
  lu: 'Luba-Katanga',
  lv: 'Latvian',
  mg: 'Malagasy',
  mh: 'Marshallese',
  mi: 'Māori',
  mk: 'Macedonian',
  ml: 'Malayalam',
  mn: 'Mongolian',
  mr: 'Marathi',
  ms: 'Malay',
  mt: 'Maltese',
  my: 'Burmese',
  na: 'Nauru',
  nb: 'Norwegian Bokmål',
  nd: 'Northern Ndebele',
  ne: 'Nepali',
  ng: 'Ndonga',
  nl: 'Dutch',
  nn: 'Norwegian Nynorsk',
  no: 'Norwegian',
  nr: 'Southern Ndebele',
  nv: 'Navajo',
  ny: 'Chichewa',
  oc: 'Occitan',
  oj: 'Ojibwe',
  om: 'Oromo',
  or: 'Oriya',
  os: 'Ossetian',
  pa: 'Panjabi',
  pi: 'Pāli',
  pl: 'Polish',
  ps: 'Pashto',
  pt: 'Portuguese',
  qu: 'Quechua',
  rm: 'Romansh',
  rn: 'Kirundi',
  ro: 'Romanian',
  ru: 'Russian',
  rw: 'Kinyarwanda',
  sa: 'Sanskrit',
  sc: 'Sardinian',
  sd: 'Sindhi',
  se: 'Northern Sami',
  sg: 'Sango',
  si: 'Sinhala',
  sk: 'Slovak',
  sl: 'Slovene',
  sm: 'Samoan',
  sn: 'Shona',
  so: 'Somali',
  sq: 'Albanian',
  sr: 'Serbian',
  ss: 'Swati',
  st: 'Southern Sotho',
  su: 'Sundanese',
  sv: 'Swedish',
  sw: 'Swahili',
  ta: 'Tamil',
  te: 'Telugu',
  tg: 'Tajik',
  th: 'Thai',
  ti: 'Tigrinya',
  tk: 'Turkmen',
  tl: 'Tagalog',
  tn: 'Tswana',
  to: 'Tonga',
  tr: 'Turkish',
  ts: 'Tsonga',
  tt: 'Tatar',
  tw: 'Twi',
  ty: 'Tahitian',
  ug: 'Uyghur',
  uk: 'Ukrainian',
  ur: 'Urdu',
  uz: 'Uzbek',
  ve: 'Venda',
  vi: 'Vietnamese',
  vo: 'Volapük',
  wa: 'Walloon',
  wo: 'Wolof',
  xh: 'Xhosa',
  yi: 'Yiddish',
  yo: 'Yoruba',
  za: 'Zhuang',
  zh: 'Chinese',
  zu: 'Zulu'
};
