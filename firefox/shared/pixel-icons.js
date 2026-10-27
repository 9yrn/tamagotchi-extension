/**
 * Poyori (ポヨリ) — 8-Bit / 9-Bit Pixel Art Icons Library
 * Replaces all stock emojis with authentic, crisp retro pixel art SVG icons.
 * High DPI, crisp edges, zero external image assets.
 */

// Helper to encode SVG to base64
function toBase64(str) {
  if (typeof btoa === 'function') {
    return btoa(str);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str).toString('base64');
  }
  return encodeURIComponent(str);
}

// Color palettes for 8-bit UI icons
const ICON_COLORS = {
  '.': 'transparent',
  '#': '#24140e', // dark outline
  'r': '#d63d2f', // red
  'R': '#ff7675', // bright red / pink
  'y': '#f3a83b', // golden yellow
  'Y': '#fedb72', // bright gold
  'g': '#5cb85c', // emerald green
  'G': '#a8e6cf', // light mint green
  'c': '#45b7b8', // cyan
  'C': '#74b9ff', // light cyan/sky
  'p': '#9966cc', // violet
  'P': '#d980fa', // light purple
  'w': '#f5f6fa', // white / cream
  'W': '#f5e4c8', // parchment cream
  'b': '#2d3436', // slate dark
  'B': '#636e72', // slate grey
  'o': '#d88344', // amber wood
  'O': '#f2ad6e'  // light amber
};

// 10x10 and 8x8 Pixel Icon Matrices
const ICON_GRIDS = {
  // Food items
  apple: [
    "....#.....",
    "...#g#....",
    "..##r##...",
    ".#rrrrr#..",
    "#rrrrrrr#.",
    "#rWrrrrr#.",
    "#rrrrrrr#.",
    "#rrrrrrr#.",
    ".#rrrrr#..",
    "..#####..."
  ],
  steamed_bun: [
    "....##....",
    "...#WW#...",
    "..#WWWW#..",
    ".#WWWWWW#.",
    "#WWWWWWWW#",
    "#WW#WW#WW#",
    "#WWWWWWWW#",
    ".#WWWWWW#.",
    "..######..",
    ".........."
  ],
  rice_cracker: [
    "...####...",
    "..#oooo#..",
    ".#oooooo#.",
    "#oo#bb#oo#",
    "#oo#bb#oo#",
    "#oo#bb#oo#",
    "#oo#bb#oo#",
    ".#oooooo#.",
    "..#oooo#..",
    "...####..."
  ],
  matcha_tea: [
    "..........",
    "..######..",
    ".#gGgGgG#.",
    "#gggggggg#",
    "#bbbbbbbb#",
    "#bWWWWWWb#",
    "#bWWWWWWb#",
    ".#bbbbbb#.",
    "..######..",
    ".........."
  ],
  golden_apple: [
    "...#Y#....",
    "..#yG#....",
    "..##Y##...",
    ".#yyyyy#..",
    "#yyYyyyy#.",
    "#yYYyyyy#.",
    "#yyyyyyy#.",
    "#yyyyyyy#.",
    ".#yyyyy#..",
    "..#####..."
  ],
  herb_leaf: [
    "......##..",
    ".....#gg#.",
    "....#gGg#.",
    "...#ggGg#.",
    "..#ggGgg#.",
    ".#ggGgg#..",
    ".#gGgg#...",
    "..#gg#....",
    "...##.....",
    ".........."
  ],

  // Vitals & Stats
  coin: [
    "...####...",
    "..#YYYY#..",
    ".#YY##YY#.",
    "#YY#yy#YY#",
    "#YY#yy#YY#",
    "#YY#yy#YY#",
    "#YY#yy#YY#",
    ".#YY##YY#.",
    "..#YYYY#..",
    "...####..."
  ],
  flame: [
    "....##....",
    "...#YY#...",
    "..#yYYy#..",
    "..#yYYy#..",
    ".#ryYYyr#.",
    ".#ryyyyr#.",
    "#rryyyyrr#",
    "#rrrryrrr#",
    ".#rrrrrr#.",
    "..######.."
  ],
  heart_full: [
    ".##..##.",
    "#rr##rr#",
    "#rRrRrr#",
    "#rrrrrr#",
    "#rrrrrr#",
    ".#rrrr#.",
    "..#rr#..",
    "...##..."
  ],
  heart_empty: [
    ".##..##.",
    "#bb##bb#",
    "#b....b#",
    "#b....b#",
    "#b....b#",
    ".#b..b#.",
    "..#bb#..",
    "...##..."
  ],
  spark: [
    "....##..",
    "...#YY#.",
    "..#YY#..",
    ".#YYYY#.",
    ".#YYYY#.",
    "...#YY#.",
    "..#YY#..",
    ".#Y#....",
    ".##.....",
    "........"
  ],
  sakura: [
    "..##..##..",
    ".#RR##RR#.",
    "#RRRRRRRR#",
    "#RRRWWRRR#",
    ".#RRWWRR#.",
    "#RRRWWRRR#",
    "#RRRRRRRR#",
    ".#RR##RR#.",
    "..##..##..",
    ".........."
  ],

  // Navigation & Tabs
  stats_bars: [
    "..........",
    ".......##.",
    ".......#c#",
    "....##.#c#",
    "....#c##c#",
    ".##.#c##c#",
    ".#c##c##c#",
    ".#c##c##c#",
    ".########.",
    ".........."
  ],
  tasks_scroll: [
    "..####....",
    ".#WWWW#...",
    "#WW##WW#..",
    "#WWWWWW#..",
    "#WW##WW#..",
    "#WWWWWW#..",
    "#WW##WW#..",
    ".#WWWW#...",
    "..####....",
    ".........."
  ],
  book_zukan: [
    "..######..",
    ".#PppppP#.",
    "#Ppp#ppP#.",
    "#Ppp#ppP#.",
    "#Pp###pP#.",
    "#Ppp#ppP#.",
    "#Ppp#ppP#.",
    "#PppppP#..",
    ".#WWWW#...",
    "..####...."
  ],
  wardrobe_robe: [
    "....##....",
    "...#rr#...",
    "..#rrrr#..",
    ".#rrWWrr#.",
    "#rrrWWrrr#",
    "#rr#WW#rr#",
    "#rr#WW#rr#",
    "#rrrrrrrr#",
    ".#rrrrrr#.",
    "..######.."
  ],
  globe: [
    "...####...",
    "..#cccc#..",
    ".#c#cc#c#.",
    "#cc#cc#cc#",
    "#cccccccc#",
    "#cccccccc#",
    "#cc#cc#cc#",
    ".#c#cc#c#.",
    "..#cccc#..",
    "...####..."
  ],
  gear: [
    "..##..##..",
    ".#bb##bb#.",
    "##bbbbbb##",
    "#bb####bb#",
    "#bb#..#bb#",
    "#bb#..#bb#",
    "#bb####bb#",
    "##bbbbbb##",
    ".#bb##bb#.",
    "..##..##.."
  ],
  handheld_device: [
    "...####...",
    "..#oooo#..",
    ".#o####o#.",
    "#o#gGGg#o#",
    "#o#gGGg#o#",
    "#o######o#",
    "#o#y##y#o#",
    ".#oooooo#.",
    "..#oooo#..",
    "...####..."
  ],

  // Actions & Emotes
  hand_pet: [
    "....##....",
    "...#WW#...",
    "..#WWWW#..",
    ".#WWWWWW#.",
    "#WWWWWWWW#",
    "#WWWWWWWW#",
    ".#WWWWWW#.",
    "..#WWWW#..",
    "...####...",
    ".........."
  ],
  sleep_zzz: [
    ".#####....",
    "....#c#...",
    "...#c#....",
    "..#c#.....",
    ".#####....",
    ".....####.",
    ".......#c#",
    "......#c#.",
    ".....####.",
    ".........."
  ],
  mystery: [
    "..######..",
    ".#yYYYYy#.",
    "#yy####yy#",
    "####..#yy#",
    ".....#yy#.",
    "....#yy#..",
    "....####..",
    "..........",
    "....#YY#..",
    "....####.."
  ],
  check: [
    "........#.",
    ".......#g#",
    "......#gg#",
    ".#...#gg#.",
    ".#g#.#gg#.",
    "..#g#gg#..",
    "...#ggg#..",
    "....#g#...",
    ".....#....",
    ".........."
  ],
  cross: [
    "#......#..",
    ".#r..r#...",
    "..#rr#....",
    "...#r#....",
    "..#rr#....",
    ".#r..r#...",
    "#......#..",
    "..........",
    "..........",
    ".........."
  ],
  star: [
    "....##....",
    "...#YY#...",
    "..#yYYy#..",
    "###yYYy###",
    ".#YYYYYY#.",
    "..#yYYy#..",
    ".#yy##yy#.",
    "#Y#....#Y#",
    "..........",
    ".........."
  ],
  neutral_dot: [
    "...####...",
    "..#BBBB#..",
    ".#BBwwBB#.",
    "#BBwwwwBB#",
    "#BBwwwwBB#",
    ".#BBwwBB#.",
    "..#BBBB#..",
    "...####...",
    "..........",
    ".........."
  ],
  gender_male: [
    "....##CCCC",
    "....#...CC",
    "....#.C#CC",
    "...#..C#..",
    "..#b##b#..",
    ".#b....b#.",
    ".#b....b#.",
    "..#b##b#..",
    "....##....",
    ".........."
  ],
  gender_female: [
    "..#RRRR#..",
    ".#R....R#.",
    ".#R....R#.",
    "..#RRRR#..",
    "....##....",
    "..######..",
    "....##....",
    "....##....",
    "..........",
    ".........."
  ],
  water_drop: [
    "....##....",
    "...#CC#...",
    "..#CCCC#..",
    ".#CCCCCC#.",
    "#CcCCCCCC#",
    "#CCcCCCCC#",
    "#CCCCCCCC#",
    ".#CCCCCC#.",
    "..######..",
    ".........."
  ],
  paw: [
    ".##..##...",
    "#WW##WW#..",
    "#WW##WW#..",
    ".##..##...",
    "..####....",
    ".#WWWW#...",
    "#WWWWWW#..",
    ".######...",
    "..........",
    ".........."
  ],

  // Accessories
  crown: [
    "#...#...#.",
    "#y#.#y#.#y",
    "#yyyyyyyy#",
    "#yy#rr#yy#",
    ".########."
  ],
  hachimaki: [
    "##########",
    "#rrrrrrrr#",
    "#rr#WW#rr#",
    "##########"
  ],
  tanuki_leaf: [
    "....#.....",
    "...#g#....",
    "..#ggg#...",
    ".#ggggg#..",
    "..#ggg#...",
    "...#g#....",
    "....#....."
  ],
  wizard_hat: [
    "....#.....",
    "...#P#....",
    "..#PPP#...",
    ".#PPyPP#..",
    "#########."
  ],
  cyber_visor: [
    "##########",
    "#cccccccc#",
    "#cc#..#cc#",
    "##########"
  ]
};

export { ICON_GRIDS, ICON_COLORS };

// Mapping from common Unicode emojis to pixel icon keys
const EMOJI_TO_KEY = {
  '❤️': 'heart_full',
  '🖤': 'heart_empty',
  '⚡': 'spark',
  '🔥': 'flame',
  '🪙': 'coin',
  '🌸': 'sakura',
  '🍎': 'apple',
  '🥟': 'steamed_bun',
  '🍘': 'rice_cracker',
  '🍵': 'matcha_tea',
  '🍏': 'golden_apple',
  '🌿': 'herb_leaf',
  '🐾': 'paw',
  '✨': 'star',
  '🌟': 'star',
  '💤': 'sleep_zzz',
  '💧': 'water_drop',
  '⚪': 'neutral_dot',
  '❓': 'mystery',
  '✋': 'hand_pet',
  '📟': 'handheld_device',
  '📊': 'stats_bars',
  '📝': 'tasks_scroll',
  '📖': 'book_zukan',
  '👘': 'wardrobe_robe',
  '⚙️': 'gear',
  '⚙': 'gear',
  '🌐': 'globe',
  '✓': 'check',
  '✕': 'cross'
};

/**
 * Compiles an icon grid into a Base64 SVG Data URI
 */
export function getPixelIconUrl(iconKey) {
  const resolvedKey = EMOJI_TO_KEY[iconKey] || iconKey;
  const grid = ICON_GRIDS[resolvedKey] || ICON_GRIDS.mystery;
  const height = grid.length;
  const width = grid[0].length;

  let rects = '';
  for (let y = 0; y < height; y++) {
    const row = grid[y];
    if (!row) continue;
    for (let x = 0; x < width; x++) {
      const char = row[x];
      if (char && char !== '.' && ICON_COLORS[char]) {
        rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${ICON_COLORS[char]}"/>`;
      }
    }
  }

  const svgXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${rects}</svg>`;
  return `data:image/svg+xml;base64,${toBase64(svgXml)}`;
}

/**
 * Returns an HTML string rendering the pixel icon
 */
export function getPixelIconHtml(iconKey, size = 16, className = 'pixel-ui-icon') {
  const src = getPixelIconUrl(iconKey);
  return `<img class="${className}" src="${src}" alt="${iconKey}" style="width: ${size}px; height: ${size}px; image-rendering: pixelated; vertical-align: middle; display: inline-block;">`;
}
