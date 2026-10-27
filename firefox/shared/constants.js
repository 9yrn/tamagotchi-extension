/**
 * Poyori (ポヨリ) — 8-Bit Virtual Web Companion
 * Constants, Terminology, Creature Bestiary & Presets
 */

export const TERMINOLOGY = {
  // Modes: 'bilingual' (default), 'japanese', 'english'
  modes: {
    BILINGUAL: 'bilingual',
    JAPANESE: 'japanese',
    ENGLISH: 'english'
  },
  dict: {
    world: { ja: 'もちもり', romaji: 'Mochimori', en: 'Mochi Forest' },
    petNameDefault: { ja: 'ポヨリ', romaji: 'Poyori', en: 'Poyori' },
    
    // Stages
    stage1: { ja: '卵', romaji: 'Tamago', en: 'Egg', num: 1, desc: 'A mysterious egg waiting to hatch' },
    stage2: { ja: '生まれ', romaji: 'Umare', en: 'Hatchling', num: 2, desc: 'Birth; the beginning of a creature\'s life' },
    stage3: { ja: '木霊', romaji: 'Kodama', en: 'Young Spirit', num: 3, desc: 'A young spirit beginning to develop' },
    stage4: { ja: '精神', romaji: 'Seishin', en: 'Developing Mind', num: 4, desc: 'Spirit or mind; a developing identity' },
    stage5: { ja: '神獣', romaji: 'Shinju', en: 'Divine Beast', num: 5, desc: 'A majestic fully-developed divine beast' },
    stage6: { ja: '神焔', romaji: 'Shin\'en', en: 'Divine Flame', num: 6, desc: 'An ascended mythic existence' },

    // Core Systems
    evolution: { ja: '進化', romaji: 'Shinka', en: 'Evolution' },
    bond: { ja: '絆', romaji: 'Kizuna', en: 'Bond & Affection' },
    radiant: { ja: '光明', romaji: 'Kōmyō', en: 'Radiant Form' },
    awakening: { ja: '覚醒', romaji: 'Kakusei', en: 'Awakening' },
    trials: { ja: '試練', romaji: 'Shiren', en: 'Trials & Quests' },
    achievements: { ja: '達成', romaji: 'Tassei', en: 'Accomplishments' },

    // Stats
    hunger: { ja: 'お腹', romaji: 'Onaka', en: 'Hunger / Fullness' },
    energy: { ja: '元気', romaji: 'Genki', en: 'Energy / Stamina' },
    experience: { ja: '経験', romaji: 'Keiken', en: 'Experience (XP)' },
    streak: { ja: '連続', romaji: 'Renzoku', en: 'Daily Streak' },
    coins: { ja: '小判', romaji: 'Koban', en: 'Pixel Coins' },

    // Branches
    branchDenki: { ja: '電気', romaji: 'Denki', en: 'Cyber / Tech' },
    branchChishiki: { ja: '知識', romaji: 'Chishiki', en: 'Scholar / Science' },
    branchMonogatari: { ja: '物語', romaji: 'Monogatari', en: 'Story / Language' },
    branchGutara: { ja: 'ぐうたら', romaji: 'Gūtara', en: 'Slacker / Sloth' },

    // Actions
    feed: { ja: 'ご飯', romaji: 'Gohan', en: 'Feed' },
    pet: { ja: '撫でる', romaji: 'Naderu', en: 'Pet' },
    sleep: { ja: '睡眠', romaji: 'Suimin', en: 'Sleep' },
    wake: { ja: '起床', romaji: 'Kishō', en: 'Wake Up' },
    wardrobe: { ja: '着せ替え', romaji: 'Kisekae', en: 'Wardrobe' },
    bestiary: { ja: '図鑑', romaji: 'Zukan', en: 'Bestiary' },
    settings: { ja: '設定', romaji: 'Settei', en: 'Settings' },

    // Moods & Emotional Reactions
    mood: { ja: '機嫌', romaji: 'Kigen', en: 'Mood' },
    moodCheerful: { ja: 'ご機嫌', romaji: 'Gokigen', en: 'Cheerful' },
    moodGrumpy: { ja: '不機嫌', romaji: 'Fukigen', en: 'Grumpy' },
    moodSleepy: { ja: '睡眠中', romaji: 'Suimin', en: 'Sleepy' },
    moodSick: { ja: '病気', romaji: 'Byōki', en: 'Sick' },

    // UI & Action Elements
    addTask: { ja: '試練追加', romaji: 'Shiren Tsuika', en: 'Add Task' },
    taskPlaceholder: { ja: '新しい試練・目標...', romaji: 'Atarashii Shiren...', en: 'New quest / task...' },
    noTasks: { ja: '試練がありません。追加してご飯を獲得しよう！', romaji: 'Shiren ga arimasen.', en: 'No active tasks. Add one to earn food!' },
    dailyQuests: { ja: '毎日のもちもり試練', romaji: 'Mainichi no Shiren', en: 'Daily Mochimori Quests' },
    complete: { ja: '完了', romaji: 'Kanryō', en: 'Complete' },
    active: { ja: '装備中', romaji: 'Sōbi-chū', en: 'Active' },
    equip: { ja: '装備', romaji: 'Sōbi', en: 'Equip' },
    buy: { ja: '購入', romaji: 'Kōnyū', en: 'Buy' },
    owned: { ja: '所持済', romaji: 'Shoji-zumi', en: 'Owned' },
    close: { ja: '閉じる', romaji: 'Tojiru', en: 'Close' },
    confirm: { ja: '決定', romaji: 'Kettei', en: 'Confirm' },
    cancel: { ja: '戻る', romaji: 'Modoru', en: 'Cancel' },

    // Safety & Focus Controls
    nsfwControl: { ja: '有害サイト遮断 (NSFW)', romaji: 'NSFW Shadan', en: 'NSFW Content Blocker' },
    blockedSites: { ja: 'カスタム遮断サイト', romaji: 'Kasam Shadan', en: 'Custom Blocked Sites' },
    addBlocked: { ja: '遮断サイト追加', romaji: 'Saito Tsuika', en: 'Add Blocked Site' },
    blockedPlaceholder: { ja: '例: twitter.com...', romaji: 'rei: twitter.com...', en: 'e.g. twitter.com...' },

    // Settings
    languageOption: { ja: '言語・表示設定', romaji: 'Gengo Settei', en: 'Language & Terms' },
    consequenceOption: { ja: '育成ペナルティ設定', romaji: 'Ikusei Penaruti', en: 'Consequence Mode' },
    soundVolume: { ja: '8ビット音量', romaji: 'Onryō', en: '8-Bit Sound Volume' },
    muteAudio: { ja: '消音 (ミュート)', romaji: 'Myūto', en: 'Mute Audio' },
    nightBedtime: { ja: '就寝時間設定', romaji: 'Shūshin Jikan', en: 'Night Bedtime' },
    classifyCurrent: { ja: '閲覧中サイト分類', romaji: 'Saito Bunrui', en: 'Classify Current Tab' },
    openDashboard: { ja: '詳細ポータルを開く', romaji: 'Pōtaru o Hiraku', en: 'Open Full Dashboard' },

    // Tabs
    tabStatus: { ja: '状態', romaji: 'Jōtai', en: 'Status' },
    tabTasks: { ja: '試練', romaji: 'Shiren', en: 'Tasks' },
    tabFood: { ja: 'ご飯', romaji: 'Gohan', en: 'Food' },
    tabZukan: { ja: '図鑑', romaji: 'Zukan', en: 'Bestiary' },
    tabWardrobe: { ja: '着替', romaji: 'Kisekae', en: 'Wardrobe' },
    tabSettings: { ja: '設定', romaji: 'Settei', en: 'Settings' }
  }
};

/**
 * Returns formatted title according to current terminology mode
 */
export function getTerm(key, mode = 'bilingual') {
  const item = TERMINOLOGY.dict[key];
  if (!item) return key;
  if (mode === 'japanese') return `${item.ja} (${item.romaji})`;
  if (mode === 'english') return item.en;
  // Bilingual mode
  return `${item.romaji} (${item.en})`;
}

export const BRANCHES = {
  coding: {
    id: 'coding',
    name: 'Coding & Tech',
    jaName: '電気 (プログラミング)',
    enName: 'Coding & Cyber',
    breed: 'cat',
    breedName: 'Cat (猫)',
    iconKey: 'spark',
    color: '#00e5ff',
    desc: 'Feline cyber spirits that thrive on code, logic, and computational mastery.'
  },
  creative: {
    id: 'creative',
    name: 'Creative Arts',
    jaName: '芸術 (デザイン・美術)',
    enName: 'Creative Arts & Design',
    breed: 'bird',
    breedName: 'Bird (鳥)',
    iconKey: 'crown',
    color: '#ff007f',
    desc: 'Avian dream weavers that flourish with illustration, visual art, and music.'
  },
  literature: {
    id: 'literature',
    name: 'Literature & Writing',
    jaName: '文学 (執筆・読書)',
    enName: 'Literature & Writing',
    breed: 'fox',
    breedName: 'Fox (狐)',
    iconKey: 'tasks_scroll',
    color: '#ff9f43',
    desc: 'Cunning Kitsune spirits that master language, storytelling, and poetic lore.'
  },
  research: {
    id: 'research',
    name: 'Research & Science',
    jaName: '研究 (科学・学術)',
    enName: 'Research & Academia',
    breed: 'owl',
    breedName: 'Owl (梟)',
    iconKey: 'book_zukan',
    color: '#9b59b6',
    desc: 'Insightful Strigid owls holding deep scientific inquiry and analytical wisdom.'
  },
  gaming: {
    id: 'gaming',
    name: 'Gaming & Dev',
    jaName: '遊戯 (ゲーム・開発)',
    enName: 'Gaming & Game Dev',
    breed: 'dragon',
    breedName: 'Dragon (龍)',
    iconKey: 'star',
    color: '#e74c3c',
    desc: 'Mighty draconic beings forged in interactive challenges, reflex, and game design.'
  },
  personal: {
    id: 'personal',
    name: 'Personal Development',
    jaName: '修身 (生活・健康)',
    enName: 'Personal Growth & Habits',
    breed: 'shiba',
    breedName: 'Shiba Inu (犬)',
    iconKey: 'heart_full',
    color: '#2ecc71',
    desc: 'Devoted Shiba spirits guiding mindfulness, health, habits, and daily discipline.'
  }
};

/**
 * Creature Theme Palettes unlocked at higher evolutions
 */
export const CREATURE_THEMES = {
  classic_default: { id: 'classic_default', name: 'Classic Original', jaName: '原色', minStage: 1, desc: 'Original authentic 9-bit Mochimori colors.' },
  neon_cyber: { id: 'neon_cyber', name: 'Neon Cyber', jaName: '電脳ネオン', minStage: 4, desc: 'Electrifying cyan, neon magenta, and digital violet.' },
  sakura_pastel: { id: 'sakura_pastel', name: 'Sakura Pastel', jaName: '桜花パステル', minStage: 4, desc: 'Soft blossom pinks, creamy ivory, and warm rose.' },
  solar_gold: { id: 'solar_gold', name: 'Solar Gold', jaName: '黄金太陽', minStage: 5, desc: 'Blinding imperial gold and celestial amber aura.' },
  abyssal_shadow: { id: 'abyssal_shadow', name: 'Abyssal Shadow', jaName: '深淵影', minStage: 5, desc: 'Obsidian dark armor with glowing ethereal highlights.' },
  celestial_shiny: { id: 'celestial_shiny', name: 'Celestial Radiant', jaName: '光明神輝', minStage: 6, desc: 'Iridescent diamond sheen radiating mythic power.' }
};

/**
 * Evolution Stages metadata with progressive level milestones
 */
export const STAGES = [
  { level: 1, id: 'tamago', termKey: 'stage1', milestoneLevel: 1, minXp: 0, hoursRequired: 0 },
  { level: 2, id: 'umare', termKey: 'stage2', milestoneLevel: 3, minXp: 100, hoursRequired: 0.5 },
  { level: 3, id: 'kodama', termKey: 'stage3', milestoneLevel: 8, minXp: 600, hoursRequired: 4 },
  { level: 4, id: 'seishin', termKey: 'stage4', milestoneLevel: 18, minXp: 2000, hoursRequired: 16 },
  { level: 5, id: 'shinju', termKey: 'stage5', milestoneLevel: 32, minXp: 5500, hoursRequired: 48 },
  { level: 6, id: 'shinen', termKey: 'stage6', milestoneLevel: 50, minXp: 12000, hoursRequired: 120 }
];

/**
 * Complete Creature Bestiary across all 4 branches
 */
/**
 * Complete Creature Bestiary across all 6 animal breed branches
 * Total: 36 unique consistent breed creatures + legacy aliases for backward compatibility
 */
export const CREATURES = {
  // ⚡ 1. CODING BRANCH (Breed: Cat / Neko)
  coding_tamago: {
    id: 'coding_tamago',
    branch: 'coding',
    breed: 'cat',
    stage: 1,
    name: 'Byte Egg',
    jaName: '電脳卵',
    desc: 'An egg crackling with digital pulses and feline whiskers on its shell.',
    spriteKey: 'egg_denki',
    specialTrick: 'Emits gentle electric purrs when held close.'
  },
  coding_baby: {
    id: 'coding_baby',
    branch: 'coding',
    breed: 'cat',
    stage: 2,
    name: 'Byte Kitten',
    jaName: 'ココネコ',
    desc: 'A curious 9-bit kitten with an antenna tail that twitches when code runs.',
    spriteKey: 'pikoneko',
    specialTrick: 'Paws at digital pixels on screen.'
  },
  coding_child: {
    id: 'coding_child',
    branch: 'coding',
    breed: 'cat',
    stage: 3,
    name: 'Cyber Cat',
    jaName: '電脳猫',
    desc: 'An agile feline wearing mechanical paw-guards and mini terminal visor.',
    spriteKey: 'kikai_neko',
    specialTrick: 'Bats around glowing neon debug cubes.'
  },
  coding_teen: {
    id: 'coding_teen',
    branch: 'coding',
    breed: 'cat',
    stage: 4,
    name: 'Bit Panther',
    jaName: 'ビット豹',
    desc: 'A sleek, lightning-fast cyber panther that stalks software bugs in compiled matrices.',
    spriteKey: 'bit_panther',
    specialTrick: 'Projects floating green terminal code and taps holographic keys.'
  },
  coding_adult: {
    id: 'coding_adult',
    branch: 'coding',
    breed: 'cat',
    stage: 5,
    name: 'Raijin Nekomata',
    jaName: '雷神猫又',
    desc: 'A twin-tailed mythical thunder cat cloaked in electric currents and logic auras.',
    spriteKey: 'raijin_nekomata',
    specialTrick: 'Summons twin lightning tails that dance in binary sparks.'
  },
  coding_radiant: {
    id: 'coding_radiant',
    branch: 'coding',
    breed: 'cat',
    stage: 6,
    isKomyo: true,
    name: 'Kōmyō Nekomata',
    jaName: '光明猫又',
    desc: 'The ascended golden thunder cat deity, blazing with 7-streak celestial lightning.',
    spriteKey: 'komyo_raijin',
    specialTrick: 'Creates a celestial matrix aura that illuminates the entire web page.'
  },

  // 🎨 2. CREATIVE ARTS BRANCH (Breed: Bird / Tori)
  creative_tamago: {
    id: 'creative_tamago',
    branch: 'creative',
    breed: 'bird',
    stage: 1,
    name: 'Prism Egg',
    jaName: '虹色卵',
    desc: 'A pastel egg bathed in shifting watercolor hues and soft down feathers.',
    spriteKey: 'egg_creative',
    specialTrick: 'Gently shifts colors to match your background.'
  },
  creative_baby: {
    id: 'creative_baby',
    branch: 'creative',
    breed: 'bird',
    stage: 2,
    name: 'Feather Pip',
    jaName: 'ピヨピヨ',
    desc: 'A fluffy avian chick whose chirps scatter colorful pastel sparkles.',
    spriteKey: 'feather_pip',
    specialTrick: 'Flutters tiny wings and leaves a trail of color dots.'
  },
  creative_child: {
    id: 'creative_child',
    branch: 'creative',
    breed: 'bird',
    stage: 3,
    name: 'Prism Finch',
    jaName: '虹雀',
    desc: 'A swift sparrow with rainbow-tipped wingtips that paints music in the breeze.',
    spriteKey: 'prism_finch',
    specialTrick: 'Performs an aerial loop and scatters rainbow confetti.'
  },
  creative_teen: {
    id: 'creative_teen',
    branch: 'creative',
    breed: 'bird',
    stage: 4,
    name: 'Origami Crane',
    jaName: '折鶴',
    desc: 'An exquisite geometric paper crane spirit folded with infinite artistic grace.',
    spriteKey: 'origami_crane',
    specialTrick: 'Folds itself into floating origami shapes.'
  },
  creative_adult: {
    id: 'creative_adult',
    branch: 'creative',
    breed: 'bird',
    stage: 5,
    name: 'Suzaku Phoenix',
    jaName: '朱雀',
    desc: 'The southern divine firebird of boundless inspiration, crowned with fiery plumes.',
    spriteKey: 'suzaku_phoenix',
    specialTrick: 'Spreads grand wings and casts an inspiring rainbow flame.'
  },
  creative_radiant: {
    id: 'creative_radiant',
    branch: 'creative',
    breed: 'bird',
    stage: 6,
    isKomyo: true,
    name: 'Kōmyō Suzaku',
    jaName: '光明朱雀',
    desc: 'The solar celestial phoenix radiating perpetual golden warmth and artistic brilliance.',
    spriteKey: 'komyo_suzaku',
    specialTrick: 'Rains golden solar feathers of infinite creative inspiration.'
  },

  // 📖 3. LITERATURE BRANCH (Breed: Fox / Kitsune)
  literature_tamago: {
    id: 'literature_tamago',
    branch: 'literature',
    breed: 'fox',
    stage: 1,
    name: 'Scroll Egg',
    jaName: '巻物卵',
    desc: 'An ancient parchment egg tied with red silk and inscribed with folklore haiku.',
    spriteKey: 'egg_literature',
    specialTrick: 'Whispers fragments of classical poetry.'
  },
  literature_baby: {
    id: 'literature_baby',
    branch: 'literature',
    breed: 'fox',
    stage: 2,
    name: 'Ink Kit',
    jaName: '墨狐',
    desc: 'A curious white fox cub with an ink-black brush tail that writes on the floor.',
    spriteKey: 'ink_kit',
    specialTrick: 'Swishes tail to draw tiny kanji glyphs.'
  },
  literature_child: {
    id: 'literature_child',
    branch: 'literature',
    breed: 'fox',
    stage: 3,
    name: 'Scroll Fox',
    jaName: '文狐',
    desc: 'A clever fox carrying an orbiting sutra scroll and bamboo writing brush.',
    spriteKey: 'scroll_fox',
    specialTrick: 'Unrolls a floating ancient scroll with proverb.'
  },
  literature_teen: {
    id: 'literature_teen',
    branch: 'literature',
    breed: 'fox',
    stage: 4,
    name: 'Mystic Kitsune',
    jaName: '妖狐',
    desc: 'A three-tailed mystical fox surrounded by glowing blue literary foxfire.',
    spriteKey: 'mystic_kitsune',
    specialTrick: 'Conjures foxfire lanterns that spell words in the air.'
  },
  literature_adult: {
    id: 'literature_adult',
    branch: 'literature',
    breed: 'fox',
    stage: 5,
    name: 'Inari Tenko',
    jaName: '天狐',
    desc: 'A celestial four-tailed white fox guardian of wisdom, poetry, and dramatic prose.',
    spriteKey: 'inari_tenko',
    specialTrick: 'Dances amidst swirling paper prayer cards.'
  },
  literature_radiant: {
    id: 'literature_radiant',
    branch: 'literature',
    breed: 'fox',
    stage: 6,
    isKomyo: true,
    name: 'Kōmyō Kyūbi',
    jaName: '光明九尾',
    desc: 'The legendary golden nine-tailed fox sovereign holding all of human imagination.',
    spriteKey: 'komyo_kyubi',
    specialTrick: 'Fans out nine glorious golden tails crowned in sacred orbs.'
  },

  // 🦉 4. RESEARCH BRANCH (Breed: Owl / Fukurō)
  research_tamago: {
    id: 'research_tamago',
    branch: 'research',
    breed: 'owl',
    stage: 1,
    name: 'Gnosi Egg',
    jaName: '知恵卵',
    desc: 'A speckled blue egg engraved with astrolabes and mathematical equations.',
    spriteKey: 'egg_research',
    specialTrick: 'Emits a rhythmic ticking like an antique pocket watch.'
  },
  research_baby: {
    id: 'research_baby',
    branch: 'research',
    breed: 'owl',
    stage: 2,
    name: 'Curious Owlet',
    jaName: 'フクロウ雛',
    desc: 'A round, fluffy owlet that rotates its head 270 degrees to inspect every detail.',
    spriteKey: 'curious_owlet',
    specialTrick: 'Bobs head in inquisitive circles.'
  },
  research_child: {
    id: 'research_child',
    branch: 'research',
    breed: 'owl',
    stage: 3,
    name: 'Scholar Owl',
    jaName: '学者梟',
    desc: 'A studious owl wearing an 8-bit monocle and clutching a leather-bound journal.',
    spriteKey: 'scholar_owl',
    specialTrick: 'Adjusts monocle and examines data runes.'
  },
  research_teen: {
    id: 'research_teen',
    branch: 'research',
    breed: 'owl',
    stage: 4,
    name: 'Sage Strigid',
    jaName: '賢者梟',
    desc: 'A majestic horned owl that perches upon an orbiting celestial armillary sphere.',
    spriteKey: 'sage_strigid',
    specialTrick: 'Spins the celestial sphere to chart constellations.'
  },
  research_adult: {
    id: 'research_adult',
    branch: 'research',
    breed: 'owl',
    stage: 5,
    name: 'Chrono Aegolius',
    jaName: '時空梟',
    desc: 'A master of temporal science and cosmic analysis, gazing across timelines.',
    spriteKey: 'chrono_aegolius',
    specialTrick: 'Slows down local particle time in a shimmering pulse.'
  },
  research_radiant: {
    id: 'research_radiant',
    branch: 'research',
    breed: 'owl',
    stage: 6,
    isKomyo: true,
    name: 'Kōmyō Chronos',
    jaName: '光明時空梟',
    desc: 'The ascended golden cosmic owl holding the ultimate unified truths of the universe.',
    spriteKey: 'komyo_chronos',
    specialTrick: 'Opens a golden temporal rift revealing shimmering stars.'
  },

  // 🐲 5. GAMING BRANCH (Breed: Dragon / Ryū)
  gaming_tamago: {
    id: 'gaming_tamago',
    branch: 'gaming',
    breed: 'dragon',
    stage: 1,
    name: 'Wyrm Egg',
    jaName: '竜の卵',
    desc: 'A scaly obsidian egg that rumbles with 8-bit chiptune basslines.',
    spriteKey: 'egg_gaming',
    specialTrick: 'Flashes glowing health-bar colors.'
  },
  gaming_baby: {
    id: 'gaming_baby',
    branch: 'gaming',
    breed: 'dragon',
    stage: 2,
    name: 'Arcade Wyrmling',
    jaName: 'コリュウ',
    desc: 'A chubby baby dragon with tiny wings that sneezes harmless pixel fireballs.',
    spriteKey: 'arcade_wyrmling',
    specialTrick: 'Hiccups an 8-bit fireball with sound effect.'
  },
  gaming_child: {
    id: 'gaming_child',
    branch: 'gaming',
    breed: 'dragon',
    stage: 3,
    name: 'Pixel Drake',
    jaName: '画素竜',
    desc: 'A horned drake sporting retro D-pad markings and high-voltage tail crystals.',
    spriteKey: 'pixel_drake',
    specialTrick: 'Performs a mini combat roll and fires pixel sparks.'
  },
  gaming_teen: {
    id: 'gaming_teen',
    branch: 'gaming',
    breed: 'dragon',
    stage: 4,
    name: 'Combo Wyvern',
    jaName: '連撃竜',
    desc: 'A swift, armored gaming wyvern driven by fighting game combos and rapid reflexes.',
    spriteKey: 'combo_wyvern',
    specialTrick: 'Strikes a fighting game victory pose with combo count.'
  },
  gaming_adult: {
    id: 'gaming_adult',
    branch: 'gaming',
    breed: 'dragon',
    stage: 5,
    name: 'Shinryū Master',
    jaName: '神竜',
    desc: 'A colossal serpentine dragon deity embodying mastery over all game worlds.',
    spriteKey: 'shinryu_master',
    specialTrick: 'Coils in the sky holding a glowing legendary high-score orb.'
  },
  gaming_radiant: {
    id: 'gaming_radiant',
    branch: 'gaming',
    breed: 'dragon',
    stage: 6,
    isKomyo: true,
    name: 'Kōmyō Shinryū',
    jaName: '光明神竜',
    desc: 'The supreme golden dragon sovereign blazing with 100% completion aura.',
    spriteKey: 'komyo_shinryu',
    specialTrick: 'Unleashes a majestic celestial dragon roar with fireworks.'
  },

  // 🐕 6. PERSONAL DEVELOPMENT BRANCH (Breed: Shiba Inu / Inu)
  personal_tamago: {
    id: 'personal_tamago',
    branch: 'personal',
    breed: 'shiba',
    stage: 1,
    name: 'Zen Egg',
    jaName: '心の卵',
    desc: 'A soothing warm cream egg wrapped in a miniature red prayer omamori.',
    spriteKey: 'egg_personal',
    specialTrick: 'Gives off a gentle relaxing heartbeat.'
  },
  personal_baby: {
    id: 'personal_baby',
    branch: 'personal',
    breed: 'shiba',
    stage: 2,
    name: 'Loyal Pup',
    jaName: '豆柴',
    desc: 'A determined little Shiba pup wearing a red hachimaki headband ready to work.',
    spriteKey: 'loyal_pup',
    specialTrick: 'Wags curled tail furiously and gives an encouraging yip.'
  },
  personal_child: {
    id: 'personal_child',
    branch: 'personal',
    breed: 'shiba',
    stage: 3,
    name: 'Zen Shiba',
    jaName: '座禅柴',
    desc: 'A disciplined canine meditating in zazen posture, cultivating iron mindfulness.',
    spriteKey: 'zen_shiba',
    specialTrick: 'Floats 2 inches off the ground in deep zen meditation.'
  },
  personal_teen: {
    id: 'personal_teen',
    branch: 'personal',
    breed: 'shiba',
    stage: 4,
    name: 'Guardian Inu',
    jaName: '守護犬',
    desc: 'An athletic, brave canine guardian dedicated to physical health and consistent habits.',
    spriteKey: 'guardian_inu',
    specialTrick: 'Does a brisk set of morning stretching exercises.'
  },
  personal_adult: {
    id: 'personal_adult',
    branch: 'personal',
    breed: 'shiba',
    stage: 5,
    name: 'Komainu Celestial',
    jaName: '狛犬',
    desc: 'A sacred lion-dog spirit guardian stationed at the gateway of personal achievement.',
    spriteKey: 'komainu_celestial',
    specialTrick: 'Strikes paws down to create a protective wellness barrier.'
  },
  personal_radiant: {
    id: 'personal_radiant',
    branch: 'personal',
    breed: 'shiba',
    stage: 6,
    isKomyo: true,
    name: 'Kōmyō Komainu',
    jaName: '光明狛犬',
    desc: 'The transcendent golden canine divinity of unshakeable willpower and inner peace.',
    spriteKey: 'komyo_komainu',
    specialTrick: 'Radiates a warm golden halo that fills the user with peaceful motivation.'
  },

    // Backward-compatibility aliases for legacy creature IDs
  denki_tamago: { id: 'denki_tamago', isAlias: true, branch: 'denki', breed: 'cat', stage: 1, name: 'Denki Tamago', jaName: '電気卵', desc: 'An egg crackling with digital energy.', spriteKey: 'egg_denki' },
  pikoneko: { id: 'pikoneko', isAlias: true, branch: 'denki', breed: 'cat', stage: 2, name: 'Pikoneko', jaName: 'ピコ猫', desc: 'A tiny pixel kitten.', spriteKey: 'pikoneko' },
  kikai_neko: { id: 'kikai_neko', isAlias: true, branch: 'denki', breed: 'cat', stage: 3, name: 'Kikai Neko', jaName: '機械猫', desc: 'A cybernetic cat with paw-guards.', spriteKey: 'kikai_neko' },
  glitch_golem: { id: 'glitch_golem', isAlias: true, branch: 'denki', breed: 'cat', stage: 4, name: 'Glitch Golem', jaName: 'グリッチゴーレム', desc: 'A sleek cyber panther.', spriteKey: 'bit_panther' },
  raijin_drake: { id: 'raijin_drake', isAlias: true, branch: 'denki', breed: 'cat', stage: 5, name: 'Raijin Drake', jaName: '雷神ドレイク', desc: 'Twin-tailed mythical thunder cat.', spriteKey: 'raijin_nekomata' },
  komyo_raijin: { id: 'komyo_raijin', isAlias: true, branch: 'denki', breed: 'cat', stage: 6, isKomyo: true, name: 'Kōmyō Raijin', jaName: '光明雷神', desc: 'Radiant thunder cat deity.', spriteKey: 'komyo_raijin' },
  denki_adult: { id: 'denki_adult', isAlias: true, branch: 'denki', breed: 'cat', stage: 5, name: 'Raijin Drake', jaName: '雷神ドレイク', desc: 'Twin-tailed mythical thunder cat.', spriteKey: 'raijin_nekomata' },

  chishiki_tamago: { id: 'chishiki_tamago', isAlias: true, branch: 'chishiki', breed: 'owl', stage: 1, name: 'Chishiki Tamago', jaName: '知識卵', desc: 'An egg inscribed with glyphs.', spriteKey: 'egg_research' },
  fukuro_ko: { id: 'fukuro_ko', isAlias: true, branch: 'chishiki', breed: 'owl', stage: 2, name: 'Fukurō-ko', jaName: 'ふくろう子', desc: 'A tiny owlet with giant eyes.', spriteKey: 'curious_owlet' },
  owl_mage: { id: 'owl_mage', isAlias: true, branch: 'chishiki', breed: 'owl', stage: 3, name: 'Owl Mage', jaName: 'オウルメイジ', desc: 'A magical owl scholar.', spriteKey: 'scholar_owl' },
  hoshi_sphinx: { id: 'hoshi_sphinx', isAlias: true, branch: 'chishiki', breed: 'owl', stage: 4, name: 'Hoshi Sphinx', jaName: '星スフィンクス', desc: 'A celestial sage owl.', spriteKey: 'sage_strigid' },
  hoshi_no_kenja: { id: 'hoshi_no_kenja', isAlias: true, branch: 'chishiki', breed: 'owl', stage: 5, name: 'Hoshi no Kenja', jaName: '星の賢者', desc: 'A master of temporal science.', spriteKey: 'chrono_aegolius' },
  komyo_kenja: { id: 'komyo_kenja', isAlias: true, branch: 'chishiki', breed: 'owl', stage: 6, isKomyo: true, name: 'Kōmyō Kenja', jaName: '光明賢者', desc: 'A radiant golden owl sage.', spriteKey: 'komyo_chronos' },

  yume_tamago: { id: 'yume_tamago', isAlias: true, branch: 'monogatari', breed: 'bird', stage: 1, name: 'Yume Tamago', jaName: '夢卵', desc: 'A dreamlike pastel egg.', spriteKey: 'egg_creative' },
  hanabira_sprite: { id: 'hanabira_sprite', isAlias: true, branch: 'monogatari', breed: 'bird', stage: 2, name: 'Hanabira Sprite', jaName: '花びらスプライト', desc: 'A petal chick that scatters colors.', spriteKey: 'feather_pip' },
  kotoba_kitsune: { id: 'kotoba_kitsune', isAlias: true, branch: 'monogatari', breed: 'fox', stage: 3, name: 'Kotoba Kitsune', jaName: '言葉狐', desc: 'A clever fox reading scrolls.', spriteKey: 'scroll_fox' },
  hane_no_ryu: { id: 'hane_no_ryu', isAlias: true, branch: 'monogatari', breed: 'dragon', stage: 4, name: 'Hane no Ryū', jaName: '羽の竜', desc: 'A gaming wyvern.', spriteKey: 'combo_wyvern' },
  monogatari_kitsune: { id: 'monogatari_kitsune', isAlias: true, branch: 'monogatari', breed: 'fox', stage: 5, name: 'Monogatari Kitsune', jaName: '物語狐', desc: 'A celestial fox of lore.', spriteKey: 'inari_tenko' },
  komyo_kitsune: { id: 'komyo_kitsune', isAlias: true, branch: 'monogatari', breed: 'fox', stage: 6, isKomyo: true, name: 'Kōmyō Kitsune', jaName: '光明狐', desc: 'A radiant nine-tailed fox.', spriteKey: 'komyo_kyubi' },

  nemu_tamago: { id: 'nemu_tamago', isAlias: true, branch: 'gutara', breed: 'shiba', stage: 1, name: 'Nemu Tamago', jaName: 'ねむ卵', desc: 'A peaceful egg.', spriteKey: 'egg_personal' },
  mochi_blob: { id: 'mochi_blob', isAlias: true, branch: 'gutara', breed: 'shiba', stage: 2, name: 'Mochi Blob', jaName: 'モチブロブ', desc: 'A spirited Shiba pup.', spriteKey: 'loyal_pup' },
  gutara_slime: { id: 'gutara_slime', isAlias: true, branch: 'gutara', breed: 'shiba', stage: 3, name: 'Gūtara Slime', jaName: 'ぐうたらスライム', desc: 'A meditating zen dog.', spriteKey: 'zen_shiba' },
  namakemono: { id: 'namakemono', isAlias: true, branch: 'gutara', breed: 'shiba', stage: 4, name: 'Namakemono', jaName: '怠け者', desc: 'A brave canine guardian.', spriteKey: 'guardian_inu' },
  daradara_oni: { id: 'daradara_oni', isAlias: true, branch: 'gutara', breed: 'shiba', stage: 5, name: 'Daradara Oni', jaName: 'だらだら鬼', desc: 'A celestial lion-dog.', spriteKey: 'komainu_celestial' },
  komyo_daradara: { id: 'komyo_daradara', isAlias: true, branch: 'gutara', breed: 'shiba', stage: 6, isKomyo: true, name: 'Taida no Kami', jaName: '怠惰の神', desc: 'Radiant canine divinity.', spriteKey: 'komyo_komainu' }
};

export const FOOD_ITEMS = {
  ringo: {
    id: 'ringo',
    name: 'Ringo',
    jaName: 'りんご',
    enName: 'Crisp Apple',
    iconKey: 'apple',
    hungerRestore: 25,
    energyRestore: 5,
    kizunaBoost: 5,
    cost: 5,
    desc: 'A sweet red apple grown in Mochimori orchard.'
  },
  nikuman: {
    id: 'nikuman',
    name: 'Nikuman',
    jaName: '肉まん',
    enName: 'Steamed Bun',
    iconKey: 'steamed_bun',
    hungerRestore: 50,
    energyRestore: 15,
    kizunaBoost: 10,
    cost: 12,
    desc: 'A warm, savory bun packed with hearty nutrients.'
  },
  senbei: {
    id: 'senbei',
    name: 'Senbei',
    jaName: '煎餅',
    enName: 'Rice Cracker',
    iconKey: 'rice_cracker',
    hungerRestore: 15,
    energyRestore: 5,
    kizunaBoost: 15,
    cost: 6,
    desc: 'A crispy soy sauce cracker that Poyori loves to crunch.'
  },
  matcha: {
    id: 'matcha',
    name: 'Matcha',
    jaName: '抹茶',
    enName: 'Ceremonial Tea',
    iconKey: 'matcha_tea',
    hungerRestore: 10,
    energyRestore: 40,
    kizunaBoost: 10,
    cost: 10,
    desc: 'Whisked green tea that clears the mind and wakes your pet up.'
  },
  kin_ringo: {
    id: 'kin_ringo',
    name: 'Kin no Ringo',
    jaName: '金のりんご',
    enName: 'Golden Apple',
    iconKey: 'golden_apple',
    hungerRestore: 60,
    energyRestore: 60,
    kizunaBoost: 30,
    xpBoost: 100,
    cost: 50,
    desc: 'A rare treat awarded from 3-day streaks or master trials.'
  },
  yakuso: {
    id: 'yakuso',
    name: 'Yakusō',
    jaName: '薬草',
    enName: 'Herbal Medicine',
    iconKey: 'herb_leaf',
    hungerRestore: 10,
    energyRestore: 50,
    kizunaBoost: 5,
    curesIllness: true,
    cost: 15,
    desc: 'Traditional Mochimori herbs that cure sickness and fatigue.'
  }
};

/**
 * Wardrobe Accessories (Kisekae)
 */
export const ACCESSORIES = {
  none: { id: 'none', name: 'None', jaName: 'なし', iconKey: 'cross', cost: 0 },
  hachimaki: { id: 'hachimaki', name: 'Hachimaki', jaName: '鉢巻', enName: 'Focus Headband', iconKey: 'hachimaki', cost: 100 },
  tanuki_leaf: { id: 'tanuki_leaf', name: 'Tanuki Leaf', jaName: '木の葉', enName: 'Spirit Leaf', iconKey: 'tanuki_leaf', cost: 200 },
  retro_glasses: { id: 'retro_glasses', name: 'Retro Glasses', jaName: '伊達眼鏡', enName: 'Pixel Glasses', iconKey: 'retro_glasses', cost: 250 },
  cozy_scarf: { id: 'cozy_scarf', name: 'Cozy Scarf', jaName: '温かいマフラー', enName: 'Cozy Scarf', iconKey: 'cozy_scarf', cost: 350 },
  wizard_hat: { id: 'wizard_hat', name: 'Scholar Hat', jaName: '学者の帽子', enName: 'Wisdom Cap', iconKey: 'wizard_hat', cost: 400 },
  cyber_visor: { id: 'cyber_visor', name: 'Cyber Visor', jaName: '電脳バイザー', enName: 'Cyber Visor', iconKey: 'cyber_visor', cost: 650 },
  ninja_cowl: { id: 'ninja_cowl', name: 'Shinobi Mask', jaName: '忍の面', enName: 'Ninja Mask', iconKey: 'ninja_cowl', cost: 750 },
  red_cape: { id: 'red_cape', name: 'Hero Cape', jaName: '勇者のマント', enName: 'Hero Cape', iconKey: 'red_cape', cost: 900 },
  samurai_helm: { id: 'samurai_helm', name: 'Samurai Kabuto', jaName: '兜', enName: 'Samurai Helm', iconKey: 'samurai_helm', cost: 1100 },
  golden_crown: { id: 'golden_crown', name: 'Kōmyō Crown', jaName: '光明の冠', enName: 'Radiant Crown', iconKey: 'crown', cost: 1200 }
};

/**
 * Retro Color Palettes
 */
export const PALETTES = {
  classic_lcd: {
    id: 'classic_lcd',
    name: 'Classic 90s LCD',
    jaName: '初代液晶',
    bg: '#8b956d',
    screenBg: '#9bbc0f',
    text: '#0f380f',
    dark: '#0f380f',
    label: '#184718',
    cardBg: 'rgba(15, 56, 15, 0.09)',
    cardBorder: 'rgba(15, 56, 15, 0.25)',
    mid: '#306230',
    light: '#8bac0f'
  },
  rpg_parchment: {
    id: 'rpg_parchment',
    name: 'RPG Parchment',
    jaName: '冒険の巻物',
    bg: '#c67232',
    screenBg: '#f6e7d0',
    text: '#24140e',
    dark: '#24140e',
    label: '#8c3d12',
    cardBg: 'rgba(36, 20, 14, 0.07)',
    cardBorder: 'rgba(36, 20, 14, 0.22)',
    mid: '#c67232',
    light: '#fedb72'
  },
  gameboy_pocket: {
    id: 'gameboy_pocket',
    name: 'Pocket Monochrome',
    jaName: '白黒ポケット',
    bg: '#c4bebb',
    screenBg: '#e0f8cf',
    text: '#071821',
    dark: '#071821',
    label: '#143343',
    cardBg: 'rgba(7, 24, 33, 0.08)',
    cardBorder: 'rgba(7, 24, 33, 0.22)',
    mid: '#306850',
    light: '#86c06c'
  },
  cyber_neon: {
    id: 'cyber_neon',
    name: 'Denki Cyberpunk',
    jaName: '電脳ネオン',
    bg: '#120d2b',
    screenBg: '#18122c',
    text: '#f5f6fa',
    dark: '#f5f6fa',
    label: '#fedb72',
    cardBg: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.2)',
    mid: '#ff007f',
    light: '#00f0ff'
  },
  sakura_retro: {
    id: 'sakura_retro',
    name: 'Sakura Mochi',
    jaName: '桜もち',
    bg: '#f7d6e0',
    screenBg: '#ffeff4',
    text: '#4a1525',
    dark: '#4a1525',
    label: '#8a2444',
    cardBg: 'rgba(196, 91, 126, 0.1)',
    cardBorder: 'rgba(196, 91, 126, 0.25)',
    mid: '#c45b7e',
    light: '#f2a6bf'
  }
};

/**
 * Adjustable Tamagotchi Roaming Display Sizes
 */
export const PET_SIZES = {
  small: { id: 'small', label: 'Small', jaLabel: '小', px: 48, scale: 0.75 },
  normal: { id: 'normal', label: 'Normal', jaLabel: '標準', px: 64, scale: 1.0 },
  large: { id: 'large', label: 'Large', jaLabel: '大', px: 80, scale: 1.25 },
  giant: { id: 'giant', label: 'Giant', jaLabel: '特大', px: 96, scale: 1.5 }
};

/**
 * Built-in Curated Website Presets
 */
export const DOMAIN_PRESETS = {
  educational: {
    denki: [
      'github.com',
      'stackoverflow.com',
      'developer.mozilla.org',
      'leetcode.com',
      'w3schools.com',
      'dev.to',
      'codepen.io',
      'replit.com',
      'gitlab.com',
      'kaggle.com',
      'huggingface.co',
      'npmjs.com',
      'pypi.org',
      'crates.io',
      'pkg.go.dev',
      'typescriptlang.org',
      'rust-lang.org',
      'python.org',
      'golang.org',
      'nodejs.org',
      'react.dev',
      'nextjs.org',
      'vuejs.org',
      'svelte.dev',
      'angular.dev',
      'docker.com',
      'kubernetes.io',
      'cloud.google.com',
      'firebase.google.com',
      'vercel.com',
      'supabase.com',
      'prisma.io',
      'graphql.org',
      'codesandbox.io',
      'stackblitz.com',
      'git-scm.com',
      'news.ycombinator.com',
      'lobste.rs',
      'chatgpt.com',
      'claude.ai',
      'gemini.google.com',
      'anthropic.com',
      'openai.com'
    ],
    chishiki: [
      'wikipedia.org',
      'coursera.org',
      'edx.org',
      'khanacademy.org',
      'arxiv.org',
      'jstor.org',
      'nature.com',
      'scholar.google.com',
      'britannica.com',
      'mit.edu',
      'semanticscholar.org',
      'researchgate.net',
      'pubmed.ncbi.nlm.nih.gov',
      'springer.com',
      'sciencedirect.com',
      'biorxiv.org',
      'medrxiv.org',
      'frontiersin.org',
      'plos.org',
      'pnas.org',
      'ieee.org',
      'acm.org',
      'stanford.edu',
      'harvard.edu',
      'wolframalpha.com',
      'geogebra.org',
      'quizlet.com',
      'ankiweb.net',
      'openstax.org',
      'libretexts.org'
    ],
    monogatari: [
      'duolingo.com',
      'medium.com',
      'substack.com',
      'goodreads.com',
      'ao3.org',
      'scribd.com',
      'jisho.org',
      'wanikani.com',
      'gutenberg.org',
      'archive.org',
      'poetryfoundation.org',
      'grammarly.com',
      'thesaurus.com',
      'dictionary.com',
      'merriam-webster.com',
      'deepl.com',
      'bunpro.jp',
      'tofugu.com',
      'nhk.or.jp',
      'wattpad.com',
      'royalroad.com',
      'dribbble.com',
      'behance.net',
      'artstation.com',
      'figma.com'
    ]
  },
  distracting: [
    'youtube.com',
    'reddit.com',
    'twitter.com',
    'x.com',
    'tiktok.com',
    'instagram.com',
    'facebook.com',
    'netflix.com',
    'twitch.tv',
    'pinterest.com',
    'tumblr.com',
    '9gag.com',
    'buzzfeed.com'
  ]
};

/**
 * Adult / NSFW Domain and Keyword Registry
 */
export const NSFW_DOMAINS = [
  'pornhub.com', 'xvideos.com', 'xnxx.com', 'redtube.com', 'onlyfans.com',
  'chaturbate.com', 'stripchat.com', 'cam4.com', 'livejasmin.com', 'youporn.com',
  'tube8.com', 'spankbang.com', 'beeg.com', 'tnaflix.com', 'eporner.com',
  'hentaihaven.xxx', 'rule34.xxx', 'rule34.paheal.net', 'gelbooru.com',
  'danbooru.donmai.us', 'e-hentai.org', 'nhentai.net', 'erome.com',
  'literotica.com', 'fakku.net', 'luscious.net', 'brazzers.com',
  'bangbros.com', 'realitykings.com', 'naughtyamerica.com'
];

export const NSFW_KEYWORDS = [
  'pornhub', 'xvideos', 'xnxx', 'redtube', 'onlyfans', 'chaturbate',
  'stripchat', 'hentai', 'rule34', 'erome', 'nsfw', 'xxx', 'adultwork'
];

/**
 * Silly & Thematic Blocked Page Quotes
 * Displayed dynamically when user attempts to visit blocked or NSFW domains
 */
export const BLOCKED_SILLY_QUOTES = [
  "HOLD IT RIGHT THERE, SUMMONER! Poyori smelled slacking from a mile away! Back to your quest! 🍙⚡",
  "BONK! Go directly to focus jail! No doomscrolling allowed while Poyori is on guard duty! 🔨✨",
  "A wild Distraction Fiend appeared! Poyori cast 'Reflect 9000'! You bounced back to productivity! 🛡️💨",
  "Did you really think your 8-bit Tamagotchi wouldn't notice? Poyori is watching you! Go study! ฅ( •̀ ω •́ )ฅ",
  "ACCESS DENIED by decree of the Mochimori Spirit Council! This realm is locked with 9-bit magic! 🗝️",
  "Hmph! If you spend time here, who is going to feed Poyori? Go finish a task and bring snacks! 🍎😤",
  "Warning: High concentrations of time-wasting! Poyori initiated emergency warp back to your study! 🚀",
  "Poyori placed a giant fluffy mochi boulder in your path! You cannot pass until your quests are done! 🍡",
  "Nice try, but Poyori has 99 Defense against slacking! Return to your trials, hero! ⚔️📜",
  "Poyori is judging your life choices right now. Close this tab and earn some Mochimori XP! ( •̀ ᴗ •́ )و",
  "Error 403: Forbidden Territory! Poyori's paws are firmly blocking your keyboard! 🐾🛑",
  "Poyori unleashes Thunder Barrier! Distraction neutralized! Time to level up your brain! ⚡📚"
];

/**
 * Default Game & User State
 */
export const DEFAULT_STATE = {
  version: 2,
  pet: {
    name: 'Poyori',
    stage: 1, // Tamago
    level: 1,
    gender: 'female', // 'male' | 'female' (assigned randomly upon pet spawn/creation)
    creatureId: 'denki_tamago',
    chosenBranch: 'coding',
    activeDisciplines: ['coding'],
    mood: 'cheerful', // 'cheerful' | 'grumpy' | 'sleepy' | 'sick'
    
    // Core Vitals (0 - 100)
    onaka: 80, // Hunger / Satiety
    genki: 100, // Energy / Stamina
    kizuna: 20, // Bond / Affection
    xp: 0,
    nextStageXp: 160,
    
    // Status Flags
    isSleeping: false,
    isSick: false,
    isHatched: false,
    isKomyo: false, // 7-day streak radiant form
    isKakusei: false, // Master trial awakened form
    
    // Timestamps
    createdAt: Date.now(),
    lastFedAt: Date.now(),
    lastInteractedAt: Date.now(),
    lastTickAt: Date.now(),
    
    // Wardrobe & Cosmetics
    accessory: 'none',
    palette: 'rpg_parchment',
    theme: 'classic_default',
    unlockedAccessories: ['none'],
    unlockedPalettes: ['rpg_parchment', 'classic_lcd', 'gameboy_pocket', 'cyber_neon', 'sakura_retro'],
    unlockedThemes: ['classic_default']
  },

  // Unlocked Companion Roster
  roster: [
    {
      creatureId: 'coding_tamago',
      name: 'Poyori',
      stage: 1,
      level: 1,
      xp: 0,
      theme: 'classic_default',
      unlockedAt: Date.now()
    }
  ],
  activeRosterIndex: 0,

  // Interactive Focus Session Timer
  focusSession: {
    isActive: false,
    discipline: 'coding',
    durationMinutes: 25,
    durationSeconds: 1500,
    remainingSeconds: 1500,
    startTime: null,
    lastTickAt: null,
    distractionsCount: 0
  },

  // Inventory & Economy
  inventory: {
    ringo: 3,
    nikuman: 1,
    senbei: 2,
    matcha: 1,
    kin_ringo: 0,
    yakuso: 1
  },
  koban: 10, // Pixel Coins (starting balance requires earning)

  // Tasks & Trials
  tasks: [
    { id: 'task-1', title: 'Complete first focus session', completed: false, reward: 'ringo', coins: 10 },
    { id: 'task-2', title: 'Pet Poyori to boost Kizuna', completed: false, reward: 'senbei', coins: 10 }
  ],
  dailyQuests: [
    { id: 'quest-edu', title: 'Spend 15 mins on study websites', targetMinutes: 15, currentMinutes: 0, completed: false, coins: 25 },
    { id: 'quest-task', title: 'Finish 2 To-Do tasks', targetCount: 2, currentCount: 0, completed: false, coins: 25 },
    { id: 'quest-focus', title: 'Keep distraction under 20 mins', targetMinutes: 20, currentMinutes: 0, completed: false, coins: 30 }
  ],
  
  // Tracking & Streaks
  stats: {
    currentStreak: 1,
    bestStreak: 1,
    lastActiveDate: new Date().toISOString().slice(0, 10),
    totalTasksDone: 0,
    totalMinutesEdu: {
      coding: 0,
      creative: 0,
      literature: 0,
      research: 0,
      gaming: 0,
      personal: 0,
      denki: 0,
      chishiki: 0,
      monogatari: 0
    },
    totalMinutesDistraction: 0,
    evolutionsDiscovered: ['denki_tamago']
  },

  // Settings & Configuration
  settings: {
    languageMode: 'bilingual', // 'bilingual' | 'japanese' | 'english'
    consequenceMode: 'cozy', // 'cozy' | 'hardcore'
    tutorialCompleted: false, // Initial setup walkthrough status
    petVisible: true, // Pet roaming visibility toggle
    petSize: 'normal', // 'small' (48px) | 'normal' (64px) | 'large' (80px) | 'giant' (96px)
    petSizePx: 64,
    petScale: 1.0,
    fontSize: 'normal', // 'normal' (1.0x) | 'large' (1.2x) | 'huge' (1.35x)
    soundVolume: 0.5,
    soundMuted: false,
    silenceOnAudioTabs: true,
    
    // Safety & Focus Controls
    nsfwFilterEnabled: false,
    customBlockedSites: [],

    // Inactivity & Night Mode
    idleSleepMinutes: 5,
    nightModeEnabled: true,
    bedtimeStart: '22:30',
    bedtimeEnd: '07:30',
    
    // Distraction tolerance
    distractionFatigueMinutes: 15,
    
    // Custom domain classifications
    customEducational: [],
    customDistracting: []
  }
};
