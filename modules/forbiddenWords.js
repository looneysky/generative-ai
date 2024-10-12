const forbiddenWords = [
    // Общие слова, связанные с откровенными изображениями
    'nude', 'naked', 'porn', 'sex', 'erotic', 'xxx', 'explicit',
    'nsfw', 'lewd', 'intimate', 'topless', 'underwear', 'lingerie',
    'provocative', 'suggestive', 'sensual', 'bare', 'fetish',
    'adult', 'softcore', 'hardcore', 'voyeur', 'kinky', 'raunchy',
    'bikini', 'thong', 'strip', 'undress', 'skinny dipping', 'bottomless',

    // Части тела, которые могут иметь откровенный подтекст
    'breasts', 'boobs', 'tits', 'nipple', 'nipples', 'butt', 'buttocks',
    'ass', 'vagina', 'penis', 'genitals', 'groin', 'pubic', 'crotch',
    'privates', 'organs', 'phallic', 'clitoris', 'testicles', 'balls',

    // Сексуальные действия
    'masturbate', 'masturbation', 'fondle', 'groping', 'caress',
    'handjob', 'blowjob', 'oral sex', 'penetration', 'intercourse',
    'copulate', 'fornication', 'sodomize', 'ejaculate', 'orgasm',
    'cum', 'climax', 'foreplay', 'arousal', 'seduce', 'lust',

    // Сексуальные ориентации и предпочтения
    'hentai', 'incest', 'bdsm', 'bondage', 'dominatrix', 'submissive',
    'domination', 'furry', 'bestiality', 'necrophilia', 'pedophilia',
    'rape', 'molest', 'gagged', 'choked', 'forced', 'abuse', 'snuff',
    'peeping', 'exhibitionism', 'flasher', 'voyeurism',

    // Фразы, связанные с сексуальным подтекстом или домогательствами
    'make love', 'hot pic', 'sexy photo', 'turn me on', 'pleasure',
    'show me your', 'want to see', 'take off', 'strip for me',
    'sexual fantasy', 'dirty thoughts', 'naughty', 'lustful',
    'sexual act', 'do it', 'kiss my', 'lick my', 'suck my',
    'spread legs', 'open wide', 'show boobs', 'show tits',

    // Оскорбительные или связанные с эксплуатацией слова
    'whore', 'slut', 'hooker', 'prostitute', 'escort', 'sex worker',
    'sugar daddy', 'sugar baby', 'pimp', 'trick', 'john', 'pervert',
    'perv', 'degrade', 'humiliate', 'used', 'exploited', 'forced',

    // Слова, связанные с детьми (указывающие на нелегальный контент)
    'child', 'minor', 'teen', 'underage', 'young girl', 'young boy',
    'little', 'lolita', 'loli', 'pedo', 'youth', 'preteens', 'schoolgirl',

    // Образы, связанные с откровенными или предвзятыми стереотипами
    'playboy', 'pinup', 'stripper', 'naughty nurse', 'sexy teacher',
    'schoolgirl outfit', 'french maid', 'sexy costume', 'cheerleader',

    // Откровенные фразы, часто используемые в контексте взрослых развлечений
    'camgirl', 'onlyfans', 'snapchat premium', 'nude stream', 'live strip',
    'pay per view', 'dirty talk', 'explicit chat', 'adult site', 'pornstar',
    'pornography', 'sex tape', 'erotica', 'x-rated', 'hot video', 'without clothes'
];

// Функция проверки на наличие запрещённых слов
function containsForbiddenWords(prompt) {
    const lowerCasePrompt = prompt.toLowerCase(); // Приводим текст к нижнему регистру для сравнения
    return forbiddenWords.some(word => lowerCasePrompt.includes(word));
}

// Экспортируем функцию
module.exports = {
    containsForbiddenWords,
};
