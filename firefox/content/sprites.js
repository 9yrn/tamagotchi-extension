/**
 * Poyori (ポヨリ) — 8-Bit Pixel Sprite Engine
 * Generates crisp, authentic pixel art SVGs for all creatures, stages, and accessories.
 */

// Helper to safely convert an SVG string to base64 in both Browser and Node environments
function toBase64(str) {
  if (typeof btoa === 'function') {
    return btoa(str);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str).toString('base64');
  }
  return encodeURIComponent(str);
}

// Helper to compile a 16x16 pixel matrix with color palette into an SVG base64 data URI
function createPixelSvg(width, height, pixelMap, palette) {
  let rects = '';
  for (let y = 0; y < height; y++) {
    const row = pixelMap[y];
    if (!row) continue;
    for (let x = 0; x < width; x++) {
      const char = row[x];
      if (char && char !== '.' && palette[char]) {
        rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[char]}"/>`;
      }
    }
  }
  const svgXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${rects}</svg>`;
  return `data:image/svg+xml;base64,${toBase64(svgXml)}`;
}

// Pixel Grids for Creatures (16x16)
const GRIDS = {
  // 🥚 EGGS
  egg_denki: [
    ".....####.......",
    "...##cyyc##.....",
    "..#cyyyyyyc#....",
    ".#cyy#yyy#yc#...",
    ".#cy###y###yc#..",
    "#cyyyy#y#yyyc#..",
    "#cyyy###y#yyc#..",
    "#cyyyyyyy#yyc#..",
    "#cyyyy###yyyc#..",
    "#cyyyy#yyyyyc#..",
    ".#cyyy#yyyyc#...",
    ".#cyyyyyyyyc#...",
    "..#cyyyyyyc#....",
    "...##cyyc##.....",
    ".....####.......",
    "................"
  ],
  egg_chishiki: [
    ".....####.......",
    "...##vppv##.....",
    "..#vppppppv#....",
    ".#vpp*pppp*v#...",
    ".#vpppppppppv#..",
    "#vpp**pp**ppv#..",
    "#vppppppppppv#..",
    "#vpp*pppp*ppv#..",
    "#vppppppppppv#..",
    "#vpp**pp**ppv#..",
    ".#vppppppppv#...",
    ".#vpp*pppp*v#...",
    "..#vppppppv#....",
    "...##vppv##.....",
    ".....####.......",
    "................"
  ],
  egg_monogatari: [
    ".....####.......",
    "...##rssr##.....",
    "..#rssssssr#....",
    ".#rssssqsssr#...",
    ".#rsssqqqsssr#..",
    "#rssssssssssr#..",
    "#rsssqsssqssr#..",
    "#rssqqqsqqqsr#..",
    "#rssssssssssr#..",
    "#rssssqqqsssr#..",
    ".#rssssqsssr#...",
    ".#rssssssssr#...",
    "..#rssssssr#....",
    "...##rssr##.....",
    ".....####.......",
    "................"
  ],
  egg_gutara: [
    ".....####.......",
    "...##bwwb##.....",
    "..#bwwwwwwb#....",
    ".#bwwwwwwwwb#...",
    ".#bww##ww##wb#..",
    "#bwww##ww##wwb#.",
    "#bwwwwwwwwwwwb#.",
    "#bwwwzzzzwwwwb#.",
    "#bwwwzzzzwwwwb#.",
    "#bwwwwwwwwwwwb#.",
    ".#bwwwwwwwwb#...",
    ".#bwwwwwwwwb#...",
    "..#bwwwwwwb#....",
    "...##bwwb##.....",
    ".....####.......",
    "................"
  ],

  // ⚡ 1. DENKI CREATURES
  pikoneko_idle1: [
    "...#.......#....",
    "..#y#.....#y#...",
    ".#yy#.....#yy#..",
    ".#yy#######yy#..",
    "#yyyyyyyyyyyyy#.",
    "#yyyyyyyyyyyyy#.",
    "#yy#byyyy#byyy#.",
    "#yy###yy###yyy#.",
    "#yyyyy##yyyyyy#.",
    ".#yyyyyyyyyyy#..",
    "..#yy#yy#yy#....",
    ".#yyyyyyyyyy#...",
    "#yyyyyyyyyyyy###",
    "#yy#yyyyyy#yy#..",
    "#yy#yyyyyy#yy#..",
    ".##........##..."
  ],
  pikoneko_idle2: [
    "...#.......#....",
    "..#y#.....#y#...",
    ".#yy#.....#yy#..",
    ".#yy#######yy#..",
    "#yyyyyyyyyyyyy#.",
    "#yyyyyyyyyyyyy#.",
    "#yy#byyyy#byyy#.",
    "#yy###yy###yyy#.",
    "#yyyyy##yyyyyy#.",
    ".#yyyyyyyyyyy#..",
    ".#yyyyyyyyyy#...",
    "#yyyyyyyyyyyy###",
    "#yyyyyyyyyyyy#..",
    ".#yy#yyyy#yy#...",
    "..##......##....",
    "................"
  ],
  kikai_neko: [
    "..##.......##...",
    ".#cc#.....#cc#..",
    "#cccc#####cccc#.",
    "#cccccccccbccc#.",
    "#cc#########cc#.",
    "#cc#ggg#ggg#cc#.",
    "#cc#ggg#ggg#cc#.",
    "#cc#########cc#.",
    "#ccccccccccbccc#",
    ".#ccccccccccc#..",
    "..#ccccccccc#...",
    ".#cccc#c#cccc#..",
    "#ccccccccccccc##",
    "#cc#ccccccc#cc#.",
    ".##.........##.."
  ],
    bit_panther: [
    "...#.......#....",
    "..#b#.....#b#...",
    ".#bbb#####bbb#..",
    "#bbbbbbbbbbbbb#.",
    "#bb#cbbbbb#cbb#.",
    "#bb#cbbbbb#cbb#.",
    "#bbbbbb#bbbbbb#.",
    ".#bbbb###bbbb#..",
    "..#bbbbbbbbb#...",
    ".#bb#c#bb#c#bb#.",
    "#bbb#c#bb#c#bbb#",
    "#bbbbbbbbbbbbbb#",
    "#bb#bbbbbbbb#bb#",
    ".##.#bb###bb#.##",
    "....#bb#.#bb#..#",
    ".....##...##...#"
  ],
  glitch_golem: [
    "...#.......#....",
    "..#b#.....#b#...",
    ".#bbb#####bbb#..",
    "#bbbbbbbbbbbbb#.",
    "#bb#cbbbbb#cbb#.",
    "#bb#cbbbbb#cbb#.",
    "#bbbbbb#bbbbbb#.",
    ".#bbbb###bbbb#..",
    "..#bbbbbbbbb#...",
    ".#bb#c#bb#c#bb#.",
    "#bbb#c#bb#c#bbb#",
    "#bbbbbbbbbbbbbb#",
    "#bb#bbbbbbbb#bb#",
    ".##.#bb###bb#.##",
    "....#bb#.#bb#..#",
    ".....##...##...#"
  ],
  raijin_drake: [
    "...#.......#....",
    "..#y#.....#y#...",
    ".#yy#######yy#..",
    "#yyyyyyyyyyyyy#.",
    "#yy##byy##byyy#.",
    "#yy###yy###yyy#.",
    "#yyyyyyyyyyyyy#.",
    ".#yyy#####yyy#..",
    "#yyyy#yyy#yyyy#.",
    "##yyyyyyyyyyy##.",
    "..#yyyyyyyyy#...",
    ".#yy#yyyyy#yy#..",
    "#yy#yyyyyyy#yy#.",
    "#yy#.......#yy#.",
    ".##.........##.."
  ],
  komyo_raijin: [
    "..*...*#*...*...",
    ".*y*.*yyy*.*y*..",
    "..#yyyy*yyyy#...",
    ".#yyyy*#*yyyy#..",
    "#yyyy#*y*#yyyy#.",
    "#yyy###*###yyy#.",
    "#yyyyyy*yyyyyy#.",
    ".#yyyy***yyyy#..",
    "*#yyyyyyyyyyy#*.",
    "*#yyy*yyy*yyy#*.",
    "..#yyyyyyyyy#...",
    ".*#y#yyyyy#y#*..",
    "..##.......##...",
    "...*.......*...."
  ],

  // 📚 2. CHISHIKI CREATURES
  fukuro_ko_idle1: [
    "....#######.....",
    "...#bbbbbbb#....",
    "..#b#bbbbb#b#...",
    ".#bbbbbbbbbbb#..",
    ".#b#w#bbb#w#b#..",
    ".#b#b#bbb#b#b#..",
    ".#bbbb###bbbb#..",
    "..#bbbb#bbbb#...",
    "..#bb#####bb#...",
    ".#bbbbbbbbbbb#..",
    "#bbbbbbbbbbbbb#.",
    "#bb#bbbbbbb#bb#.",
    ".#bbbbbbbbbbb#..",
    "..#yy#...#yy#...",
    "...##.....##....",
    "................"
  ],
  fukuro_ko_idle2: [
    "....#######.....",
    "...#bbbbbbb#....",
    "..#b#bbbbb#b#...",
    ".#bbbbbbbbbbb#..",
    ".#b###bbb###b#..",
    ".#bbbb###bbbb#..",
    "..#bbbb#bbbb#...",
    "..#bb#####bb#...",
    ".#bbbbbbbbbbb#..",
    "#bbbbbbbbbbbbb#.",
    "#bb#bbbbbbb#bb#.",
    ".#bbbbbbbbbbb#..",
    "..#yy#...#yy#...",
    "...##.....##....",
    "................"
  ],
  owl_mage: [
    "....#######.....",
    "...#pp#p#pp#....",
    "..#pppppppppp#..",
    ".#pppppppppppp#.",
    ".#p#w#pppp#w#p#.",
    ".#p#p#pppp#p#p#.",
    ".#pppp###pppp#..",
    "..#pppp#pppp#...",
    ".#pppp#####p#...",
    "#pp#ppppppp#pp#.",
    "#pp#pp*pppp#pp#.",
    ".#ppppppppp#..#.",
    "..#yy#..#yy#..#.",
    "...##....##...#."
  ],
  hoshi_sphinx: [
    "...#.......#....",
    "..#p#.....#p#...",
    ".#pp#######pp#..",
    "#ppppppppppppp#.",
    "#pp#*pppp#*ppp#.",
    "#pppppp*pppppp#.",
    "#pppppp*pppppp#.",
    ".#ppppppppppp#..",
    ".#pp*ppppp*pp#..",
    "#ppppppppppppp#.",
    "#pp#ppppppp#pp#.",
    "#pp#ppppppp#pp#.",
    ".##.........##.."
  ],
  hoshi_no_kenja: [
    "....*#*#*#*.....",
    "...#ppppppp#....",
    "..#pp#ppp#pp#...",
    ".#pp#w#p#w#pp#..",
    ".#pp#p#p#p#pp#..",
    ".#pppp###pppp#..",
    "..#ppppppppp#...",
    "..#*ppppppp*#...",
    ".#ppppppppppp#..",
    "#pppppp*pppppp#.",
    "#pp#ppppppp#pp#.",
    ".##.#######.##.."
  ],
  komyo_kenja: [
    "...**#####**....",
    "..*yyyyyyyyy*...",
    ".*yy#w#y#w#yy*..",
    ".*yy#y#y#y#yy*..",
    ".*yyy#####yyy*..",
    "..*yyyyyyyyy*...",
    ".*yyyyyyyyyyy*..",
    "*yyyyyyyyyyyyy*.",
    "*yy#yyyyyyy#yy*.",
    ".**..#####..**.."
  ],

  // 📖 3. MONOGATARI CREATURES
  hanabira_sprite_idle1: [
    "....*#...#*.....",
    "...*r#...#r*....",
    "....#sssss#.....",
    "...#sssssss#....",
    "..#s#b#s#b#s#...",
    "..#sssssssss#...",
    "...#sss#sss#....",
    "....#sssss#.....",
    "...*#sssss#*....",
    "..*r#sssss#r*...",
    "...*#sssss#*....",
    ".....#s#s#......",
    ".....##.##......"
  ],
  hanabira_sprite_idle2: [
    "...*r#...#r*....",
    "....*#...#*.....",
    "....#sssss#.....",
    "...#sssssss#....",
    "..#s#b#s#b#s#...",
    "..#sssssssss#...",
    "...#sss#sss#....",
    "....#sssss#.....",
    "..*r#sssss#r*...",
    "...*#sssss#*....",
    ".....#s#s#......",
    ".....##.##......"
  ],
  kotoba_kitsune: [
    "...#.......#....",
    "..#r#.....#r#...",
    ".#rrr#####rrr#..",
    "#rrrrrrrrrrrrr#.",
    "#rr#b#rrr#b#rr#.",
    "#rrrrr#r#rrrrr#.",
    ".#rrr#####rrr#..",
    "..#rrrrrrrrr#...",
    ".#rrrr#r#rrrr#..",
    "#rrrrrrrrrrrrr#.",
    "#rr#rrrrrrr#rr##",
    ".##.rrrrrrr.##..",
    "....##...##....."
  ],
  hane_no_ryu: [
    ".....#####......",
    "...#sssssss#....",
    "..#sss#s#sss#...",
    ".#sss#b#b#sss#..",
    ".#ssss###ssss#..",
    "..#sssssssss#...",
    ".*#sssssssss#*..",
    "*ss#sssssss#ss*.",
    "*ss#sssssss#ss*.",
    ".**.#s#.#s#.**.."
  ],
  monogatari_kitsune: [
    "..#.........#...",
    ".#r#.......#r#..",
    "#rrr#######rrr#.",
    "#rrrrrrrrrrrrr#.",
    "#rr#b#rrr#b#rr#.",
    "#rrrrr#r#rrrrr#.",
    ".#rrr#####rrr#..",
    "##rrrrrrrrrrr##.",
    "#rrrrrrrrrrrrr#.",
    "#rr#rrrrrrr#rr#.",
    ".##.#######.##.."
  ],
  komyo_kitsune: [
    ".*#.........#*..",
    "*yy#.......#yy*.",
    "#yyy#######yyy#.",
    "#yy#b#yyy#b#yy#.",
    "#yyyyy#y#yyyyy#.",
    ".#yyy#####yyy#..",
    "*#yyyyyyyyyyy#*.",
    "*yy#yyyyyyy#yy*.",
    ".**..#####..**.."
  ],

  // 💤 4. GŪTARA CREATURES
  mochi_blob_idle1: [
    "................",
    "................",
    ".....#####......",
    "...##wwwww##....",
    "..#wwwwwwwww#...",
    ".#wwwwwwwwwww#..",
    ".#ww##www##ww#..",
    "#www##www##www#.",
    "#wwwwwwwwwwwww#.",
    "#wwwwww#wwwwww#.",
    "#wwwwwwwwwwwww#.",
    ".#wwwwwwwwwww#..",
    "..##wwwwwww##...",
    "....#######.....",
    "................",
    "................"
  ],
  mochi_blob_idle2: [
    "................",
    "................",
    "................",
    "....#######.....",
    "..##wwwwwww##...",
    ".#wwwwwwwwwww#..",
    "#wwwwwwwwwwwww#.",
    "#www##www##www#.",
    "#wwwwwwwwwwwww#.",
    "#wwwwww#wwwwww#.",
    "#wwwwwwwwwwwww#.",
    ".#wwwwwwwwwww#..",
    "..##wwwwwww##...",
    "....#######.....",
    "................",
    "................"
  ],
  gutara_slime: [
    ".....#####......",
    "...#ggggggg#....",
    "..#ggggggggg#...",
    ".#gg##ggg##gg#..",
    "#ggg##ggg##ggg#.",
    "#ggggggggggggg#.",
    "#ggggzzzzggggg#.",
    "#ggggggggggggg#.",
    ".#ggggggggggg#..",
    "..###########..."
  ],
  namakemono: [
    "....#######.....",
    "...#bbbbbbb#....",
    "..#bbbbbbbbb#...",
    ".#bb##bbb##bb#..",
    ".#bb##bbb##bb#..",
    ".#bbbb###bbbb#..",
    "..#bbbbbbbbb#...",
    ".#bbbbbbbbbbb#..",
    "#bb#bbbbbbb#bb#.",
    "#bb#bbbbbbb#bb#.",
    ".##.#######.##.."
  ],
  daradara_oni: [
    "...#.......#....",
    "..#r#.....#r#...",
    ".#rrr#####rrr#..",
    "#rrrrrrrrrrrrr#.",
    "#rr##rrrrr##rr#.",
    "#rrrrzzzzrrrrr#.",
    ".#rrrrrrrrrrr#..",
    ".#rrrrrrrrrrr#..",
    "#rrrrrrrrrrrrr#.",
    "#rr#rrrrrrr#rr#.",
    ".##.#######.##.."
  ],
  komyo_daradara: [
    "...**#####**....",
    "..*yyyyyyyyy*...",
    ".*yy##yyy##yy*..",
    ".*yy##yyy##yy*..",
    ".*yyyzzzzzyyy*..",
    "..*yyyyyyyyy*...",
    ".*yyyyyyyyyyy*..",
    "*yyyyyyyyyyyyy*.",
    ".**..#####..**.."
  ],

  // ==========================================
  // 🐾 36 CANONICAL BREED CREATURE MATRICES
  // ==========================================
  raijin_nekomata: [
    "..#...#...#...#.",
    ".#y#.#b#.#b#.#y#",
    "#yy###bbb###yy#.",
    "#yy#bbbbbbb#yy#.",
    ".#bb#cbbb#cbb#..",
    ".#bb#cbbb#cbb#..",
    ".#bbbbb#bbbbb#..",
    "..#bbb###bbb#...",
    ".#bb#yyyyy#bb#..",
    "#bbb#yyyyy#bbb#.",
    "#bbbbbbbbbbbbb#.",
    "#bb#bb#.#bb#bb#.",
    ".##.##...##.##..",
    "..#y#.....#y#...",
    ".#yy#.....#yy#..",
    "..##.......##..."
  ],
  raijin_nekomata_idle1: [
    "..#...#...#...#.",
    ".#y#.#b#.#b#.#y#",
    "#yy###bbb###yy#.",
    "#yy#bbbbbbb#yy#.",
    ".#bb#cbbb#cbb#..",
    ".#bb#cbbb#cbb#..",
    ".#bbbbb#bbbbb#..",
    "..#bbb###bbb#...",
    ".#bb#yyyyy#bb#..",
    "#bbb#yyyyy#bbb#.",
    "#bbbbbbbbbbbbb#.",
    "#bb#bb#.#bb#bb#.",
    ".##.##...##.##..",
    "..#y#.....#y#...",
    ".#yy#.....#yy#..",
    "..##.......##..."
  ],
  egg_creative: [
    ".....######.....",
    "...##pppppp##...",
    "..#pprrrrrrpp#..",
    ".#pprrrrrrrrpp#.",
    "#pprrrrrsssrrpp#",
    "#pprrrssssssrpp#",
    "#pprrssccccccpp#",
    "#pprrssccccccpp#",
    "#pprrssccccccpp#",
    "#pprrrssssssrpp#",
    "#pprrrrrsssrrpp#",
    ".#pprrrrrrrrpp#.",
    "..#pprrrrrrpp#..",
    "...##pppppp##...",
    ".....######.....",
    "................"
  ],
  egg_creative_idle1: [
    ".....######.....",
    "...##pppppp##...",
    "..#pprrrrrrpp#..",
    ".#pprrrrrrrrpp#.",
    "#pprrrrrsssrrpp#",
    "#pprrrssssssrpp#",
    "#pprrssccccccpp#",
    "#pprrssccccccpp#",
    "#pprrssccccccpp#",
    "#pprrrssssssrpp#",
    "#pprrrrrsssrrpp#",
    ".#pprrrrrrrrpp#.",
    "..#pprrrrrrpp#..",
    "...##pppppp##...",
    ".....######.....",
    "................"
  ],
  feather_pip: [
    ".....######.....",
    "...##ssssss##...",
    "..#ssssssssss#..",
    ".#ss#b#ss#b#ss#.",
    ".#ss#b#ss#b#ss#.",
    ".#sssss##sssss#.",
    "..#sss#yy#sss#..",
    ".#rsss####sssr#.",
    "#rrssssssssssrr#",
    "#rrssssssssssrr#",
    ".#rssssssssssr#.",
    "..#ssssssssss#..",
    "...##########...",
    "....#yy#.#yy#...",
    ".....##...##....",
    "................"
  ],
  feather_pip_idle1: [
    ".....######.....",
    "...##ssssss##...",
    "..#ssssssssss#..",
    ".#ss#b#ss#b#ss#.",
    ".#ss#b#ss#b#ss#.",
    ".#sssss##sssss#.",
    "..#sss#yy#sss#..",
    ".#rsss####sssr#.",
    "#rrssssssssssrr#",
    "#rrssssssssssrr#",
    ".#rssssssssssr#.",
    "..#ssssssssss#..",
    "...##########...",
    "....#yy#.#yy#...",
    ".....##...##....",
    "................"
  ],
  prism_finch: [
    "....#...###.....",
    "...#s#.#sss#....",
    "..#sss#sssss#...",
    ".#sssssssssss#..",
    ".#ss#b#ss#b#s#..",
    ".#sssss##sss#y#.",
    "..#sss####ss#y#.",
    ".#rsssssssss###.",
    "#rrrsssssssrrr#.",
    "#yyy#sssss#yyy#.",
    "#ccc#sssss#ccc#.",
    ".###sssssss###..",
    "...#sssssss#....",
    "....#yy#yy#.....",
    ".....##.##......",
    "................"
  ],
  prism_finch_idle1: [
    "....#...###.....",
    "...#s#.#sss#....",
    "..#sss#sssss#...",
    ".#sssssssssss#..",
    ".#ss#b#ss#b#s#..",
    ".#sssss##sss#y#.",
    "..#sss####ss#y#.",
    ".#rsssssssss###.",
    "#rrrsssssssrrr#.",
    "#yyy#sssss#yyy#.",
    "#ccc#sssss#ccc#.",
    ".###sssssss###..",
    "...#sssssss#....",
    "....#yy#yy#.....",
    ".....##.##......",
    "................"
  ],
  origami_crane: [
    "......#.........",
    ".....#s#........",
    "....#sss#...#...",
    "...#sssss#.#s#..",
    "..#sssssss#sss#.",
    ".#wwwwwwwwwwss#.",
    "#wwwwwwwwwwwws#.",
    ".#wwwwwwwwww##..",
    "..#wwwwwwww#....",
    ".#wwwwwwwwww#...",
    "#wwwwwwwwwwww#..",
    ".#wwwwwwwwww#...",
    "..#wwwwwwww#....",
    "...#wwwwww#.....",
    "....######......",
    "................"
  ],
  origami_crane_idle1: [
    "......#.........",
    ".....#s#........",
    "....#sss#...#...",
    "...#sssss#.#s#..",
    "..#sssssss#sss#.",
    ".#wwwwwwwwwwss#.",
    "#wwwwwwwwwwwws#.",
    ".#wwwwwwwwww##..",
    "..#wwwwwwww#....",
    ".#wwwwwwwwww#...",
    "#wwwwwwwwwwww#..",
    ".#wwwwwwwwww#...",
    "..#wwwwwwww#....",
    "...#wwwwww#.....",
    "....######......",
    "................"
  ],
  suzaku_phoenix: [
    "...#...##...#...",
    "..#r#.#rr#.#r#..",
    ".#rrr##rr##rrr#.",
    "#rrrrrrrrrrrrrr#",
    "#rr#b#rrrr#b#rr#",
    "#rrrrrr##rrrrrr#",
    ".#rrrr#yy#rrrr#.",
    "#y#rrrr##rrrr#y#",
    "#yy#rrrrrrrr#yy#",
    "#yyy#rrrrrr#yyy#",
    "#yy#rrrrrrrr#yy#",
    ".##.###rr###.##.",
    "......#rr#......",
    ".....#rrrr#.....",
    "....#yy##yy#....",
    ".....##..##....."
  ],
  suzaku_phoenix_idle1: [
    "...#...##...#...",
    "..#r#.#rr#.#r#..",
    ".#rrr##rr##rrr#.",
    "#rrrrrrrrrrrrrr#",
    "#rr#b#rrrr#b#rr#",
    "#rrrrrr##rrrrrr#",
    ".#rrrr#yy#rrrr#.",
    "#y#rrrr##rrrr#y#",
    "#yy#rrrrrrrr#yy#",
    "#yyy#rrrrrr#yyy#",
    "#yy#rrrrrrrr#yy#",
    ".##.###rr###.##.",
    "......#rr#......",
    ".....#rrrr#.....",
    "....#yy##yy#....",
    ".....##..##....."
  ],
  komyo_suzaku: [
    ".*..#..##..#..*.",
    ".*y#y#*yy*#y#y*.",
    "#yyyy##yy##yyyy#",
    "#yy*yyyyyyyy*yy#",
    "#yy#b#yyyy#b#yy#",
    "#yyyyyy##yyyyyy#",
    ".#yyyy#ww#yyyy#.",
    "*#*yyy####yyy*#*",
    "#yy#yyyyyyyy#yy#",
    "#yyy#yyyyyy#yyy#",
    "#yy#yyyyyyyy#yy#",
    ".**.*##yy##*.**.",
    ".....*#yy#*.....",
    "....*#yyyy#*....",
    "...*#yy##yy#*...",
    ".....**..**....."
  ],
  komyo_suzaku_idle1: [
    ".*..#..##..#..*.",
    ".*y#y#*yy*#y#y*.",
    "#yyyy##yy##yyyy#",
    "#yy*yyyyyyyy*yy#",
    "#yy#b#yyyy#b#yy#",
    "#yyyyyy##yyyyyy#",
    ".#yyyy#ww#yyyy#.",
    "*#*yyy####yyy*#*",
    "#yy#yyyyyyyy#yy#",
    "#yyy#yyyyyy#yyy#",
    "#yy#yyyyyyyy#yy#",
    ".**.*##yy##*.**.",
    ".....*#yy#*.....",
    "....*#yyyy#*....",
    "...*#yy##yy#*...",
    ".....**..**....."
  ],
  egg_literature: [
    ".....######.....",
    "...##ssssss##...",
    "..#ssssssssss#..",
    ".#ssssssssssss#.",
    "#ssssss##ssssss#",
    "#sssss#rr#sssss#",
    "#ssss#rrrr#ssss#",
    "#sssss#rr#sssss#",
    "#ssssss##ssssss#",
    "#ssss#bbbb#ssss#",
    "#sssss#bb#sssss#",
    ".#ssssssssssss#.",
    "..#ssssssssss#..",
    "...##ssssss##...",
    ".....######.....",
    "................"
  ],
  egg_literature_idle1: [
    ".....######.....",
    "...##ssssss##...",
    "..#ssssssssss#..",
    ".#ssssssssssss#.",
    "#ssssss##ssssss#",
    "#sssss#rr#sssss#",
    "#ssss#rrrr#ssss#",
    "#sssss#rr#sssss#",
    "#ssssss##ssssss#",
    "#ssss#bbbb#ssss#",
    "#sssss#bb#sssss#",
    ".#ssssssssssss#.",
    "..#ssssssssss#..",
    "...##ssssss##...",
    ".....######.....",
    "................"
  ],
  ink_kit: [
    "...#........#...",
    "..#w#......#w#..",
    ".#www######www#.",
    "#ww#r#wwww#r#ww#",
    "#wwwwwwwwwwwwww#",
    "#ww#b#wwww#b#ww#",
    "#wwwwww##wwwwww#",
    ".#wwww#bb#wwww#.",
    "..#wwww##wwww#..",
    ".#wwwwwwwwwwww#.",
    "#wwwwwwwwwwwwww#",
    "#ww#bb#ww#bb#ww#",
    ".##.##....##.##.",
    ".........#bb#...",
    "........#bbbb#..",
    ".........####..."
  ],
  ink_kit_idle1: [
    "...#........#...",
    "..#w#......#w#..",
    ".#www######www#.",
    "#ww#r#wwww#r#ww#",
    "#wwwwwwwwwwwwww#",
    "#ww#b#wwww#b#ww#",
    "#wwwwww##wwwwww#",
    ".#wwww#bb#wwww#.",
    "..#wwww##wwww#..",
    ".#wwwwwwwwwwww#.",
    "#wwwwwwwwwwwwww#",
    "#ww#bb#ww#bb#ww#",
    ".##.##....##.##.",
    ".........#bb#...",
    "........#bbbb#..",
    ".........####..."
  ],
  scroll_fox: [
    "...#........#...",
    "..#s#......#s#..",
    ".#sss######sss#.",
    "#ss#r#ssss#r#ss#",
    "#ssssssssssssss#",
    "#ss#b#ssss#b#ss#",
    "#ssssss##ssssss#",
    ".#ssss#bb#ssss#.",
    "..#ssss##ssss#..",
    ".#ssssssssssss#.",
    "#ssss#wwww#ssss#",
    "#sss#wwwwww#sss#",
    "#ss#wwwwwwww#ss#",
    ".##.###ww###.##.",
    "......#rr#......",
    ".......##......."
  ],
  scroll_fox_idle1: [
    "...#........#...",
    "..#s#......#s#..",
    ".#sss######sss#.",
    "#ss#r#ssss#r#ss#",
    "#ssssssssssssss#",
    "#ss#b#ssss#b#ss#",
    "#ssssss##ssssss#",
    ".#ssss#bb#ssss#.",
    "..#ssss##ssss#..",
    ".#ssssssssssss#.",
    "#ssss#wwww#ssss#",
    "#sss#wwwwww#sss#",
    "#ss#wwwwwwww#ss#",
    ".##.###ww###.##.",
    "......#rr#......",
    ".......##......."
  ],
  mystic_kitsune: [
    "..#..........#..",
    ".#s#...##...#s#.",
    "#sss###ss###sss#",
    "#ss#r#ssss#r#ss#",
    "#ssssssssssssss#",
    "#ss#b#ssss#b#ss#",
    "#ssssss##ssssss#",
    ".#ssss#bb#ssss#.",
    "#c#sss####sss#c#",
    "#c#ssssssssss#c#",
    ".#ssssssssssss#.",
    "#ss#bb#ss#bb#ss#",
    ".##.##....##.##.",
    "#c#..........#c#",
    "#cc#...##...#cc#",
    ".##...#cc#...##."
  ],
  mystic_kitsune_idle1: [
    "..#..........#..",
    ".#s#...##...#s#.",
    "#sss###ss###sss#",
    "#ss#r#ssss#r#ss#",
    "#ssssssssssssss#",
    "#ss#b#ssss#b#ss#",
    "#ssssss##ssssss#",
    ".#ssss#bb#ssss#.",
    "#c#sss####sss#c#",
    "#c#ssssssssss#c#",
    ".#ssssssssssss#.",
    "#ss#bb#ss#bb#ss#",
    ".##.##....##.##.",
    "#c#..........#c#",
    "#cc#...##...#cc#",
    ".##...#cc#...##."
  ],
  inari_tenko: [
    "..#...####...#..",
    ".#w#.#wwww#.#w#.",
    "#www#wwwwww#www#",
    "#ww#r#wwww#r#ww#",
    "#ww#r#wwww#r#ww#",
    "#ww#b#wwww#b#ww#",
    "#wwwwww##wwwwww#",
    ".#wwww#rr#wwww#.",
    "..#wwww##wwww#..",
    ".#wwwwwwwwwwww#.",
    "#wwwwwwwwwwwwww#",
    "#ww#rr#ww#rr#ww#",
    ".##.##....##.##.",
    "#w#..........#w#",
    "#ww#...##...#ww#",
    ".##...#yy#...##."
  ],
  inari_tenko_idle1: [
    "..#...####...#..",
    ".#w#.#wwww#.#w#.",
    "#www#wwwwww#www#",
    "#ww#r#wwww#r#ww#",
    "#ww#r#wwww#r#ww#",
    "#ww#b#wwww#b#ww#",
    "#wwwwww##wwwwww#",
    ".#wwww#rr#wwww#.",
    "..#wwww##wwww#..",
    ".#wwwwwwwwwwww#.",
    "#wwwwwwwwwwwwww#",
    "#ww#rr#ww#rr#ww#",
    ".##.##....##.##.",
    "#w#..........#w#",
    "#ww#...##...#ww#",
    ".##...#yy#...##."
  ],
  komyo_kyubi: [
    ".*..#..##..#..*.",
    ".*y#y#*yy*#y#y*.",
    "#yy#r#yyyy#r#yy#",
    "#yy#r#yyyy#r#yy#",
    "#yy#b#yyyy#b#yy#",
    "#yyyyyy##yyyyyy#",
    ".#yyyy#rr#yyyy#.",
    "*#*yyy####yyy*#*",
    "#yy#yyyyyyyy#yy#",
    "#yyy#yyyyyy#yyy#",
    ".#yyyyyyyyyyyy#.",
    "#y#*#yy##yy#*#y#",
    "#yy*...**...*yy#",
    ".#yy*.*yy*.*yy#.",
    "..#yy#yyyy#yy#..",
    "...##.####.##..."
  ],
  komyo_kyubi_idle1: [
    ".*..#..##..#..*.",
    ".*y#y#*yy*#y#y*.",
    "#yy#r#yyyy#r#yy#",
    "#yy#r#yyyy#r#yy#",
    "#yy#b#yyyy#b#yy#",
    "#yyyyyy##yyyyyy#",
    ".#yyyy#rr#yyyy#.",
    "*#*yyy####yyy*#*",
    "#yy#yyyyyyyy#yy#",
    "#yyy#yyyyyy#yyy#",
    ".#yyyyyyyyyyyy#.",
    "#y#*#yy##yy#*#y#",
    "#yy*...**...*yy#",
    ".#yy*.*yy*.*yy#.",
    "..#yy#yyyy#yy#..",
    "...##.####.##..."
  ],
  egg_research: [
    ".....######.....",
    "...##bbbbbb##...",
    "..#bbccccccbb#..",
    ".#bbccccccccbb#.",
    "#bbccc*cccc*cbb#",
    "#bbcccc#yy#ccbb#",
    "#bbccc#yyyy#cbb#",
    "#bbccc#yyyy#cbb#",
    "#bbcccc#yy#ccbb#",
    "#bbccc*cccc*cbb#",
    "#bbccccccccccbb#",
    ".#bbccccccccbb#.",
    "..#bbccccccbb#..",
    "...##bbbbbb##...",
    ".....######.....",
    "................"
  ],
  egg_research_idle1: [
    ".....######.....",
    "...##bbbbbb##...",
    "..#bbccccccbb#..",
    ".#bbccccccccbb#.",
    "#bbccc*cccc*cbb#",
    "#bbcccc#yy#ccbb#",
    "#bbccc#yyyy#cbb#",
    "#bbccc#yyyy#cbb#",
    "#bbcccc#yy#ccbb#",
    "#bbccc*cccc*cbb#",
    "#bbccccccccccbb#",
    ".#bbccccccccbb#.",
    "..#bbccccccbb#..",
    "...##bbbbbb##...",
    ".....######.....",
    "................"
  ],
  curious_owlet: [
    "....########....",
    "...#bbbbbbbb#...",
    "..#b#bbbbbb#b#..",
    ".#bbbbbbbbbbbb#.",
    ".#b#w#bbbb#w#b#.",
    ".#b#b#bbbb#b#b#.",
    ".#bbbb####bbbb#.",
    "..#bbbb##bbbb#..",
    "..#bbb#yy#bbb#..",
    ".#bbbb####bbbb#.",
    "#bbbbbbbbbbbbbb#",
    "#bb#bbbbbbbb#bb#",
    ".#bbbbbbbbbbbb#.",
    "..#yy#....#yy#..",
    "...##......##...",
    "................"
  ],
  curious_owlet_idle1: [
    "....########....",
    "...#bbbbbbbb#...",
    "..#b#bbbbbb#b#..",
    ".#bbbbbbbbbbbb#.",
    ".#b#w#bbbb#w#b#.",
    ".#b#b#bbbb#b#b#.",
    ".#bbbb####bbbb#.",
    "..#bbbb##bbbb#..",
    "..#bbb#yy#bbb#..",
    ".#bbbb####bbbb#.",
    "#bbbbbbbbbbbbbb#",
    "#bb#bbbbbbbb#bb#",
    ".#bbbbbbbbbbbb#.",
    "..#yy#....#yy#..",
    "...##......##...",
    "................"
  ],
  scholar_owl: [
    "....########....",
    "...#bbbbbbbb#...",
    "..#b#bbbbbb#b#..",
    ".#bb#yy#bb#w#b#.",
    ".#bb#yy#bb#b#b#.",
    ".#bb####bb####..",
    "..#bbb#yy#bbb#..",
    ".#bbbb####bbbb#.",
    "#bbbbbbbbbbbbbb#",
    "#bb#wwwwwwww#bb#",
    "#bb#w#bbbb#w#bb#",
    ".#b#w#bbbb#w#b#.",
    "..#wwwwwwwwww#..",
    "...#yy#..#yy#...",
    "....##....##....",
    "................"
  ],
  scholar_owl_idle1: [
    "....########....",
    "...#bbbbbbbb#...",
    "..#b#bbbbbb#b#..",
    ".#bb#yy#bb#w#b#.",
    ".#bb#yy#bb#b#b#.",
    ".#bb####bb####..",
    "..#bbb#yy#bbb#..",
    ".#bbbb####bbbb#.",
    "#bbbbbbbbbbbbbb#",
    "#bb#wwwwwwww#bb#",
    "#bb#w#bbbb#w#bb#",
    ".#b#w#bbbb#w#b#.",
    "..#wwwwwwwwww#..",
    "...#yy#..#yy#...",
    "....##....##....",
    "................"
  ],
  sage_strigid: [
    "..#..........#..",
    ".#b#...##...#b#.",
    "#bbb###bb###bbb#",
    "#bbbbbbbbbbbbbb#",
    "#bb#w#bbbb#w#bb#",
    "#bb#b#bbbb#b#bb#",
    ".#bbbb#yy#bbbb#.",
    "..#bbb####bbb#..",
    ".#bbbbbbbbbbbb#.",
    "#bb#cccccccc#bb#",
    "#bb#c#yyyy#c#bb#",
    ".#b#cccccccc#b#.",
    "..#bbbbbbbbbb#..",
    "...#yy#..#yy#...",
    "....##....##....",
    "................"
  ],
  sage_strigid_idle1: [
    "..#..........#..",
    ".#b#...##...#b#.",
    "#bbb###bb###bbb#",
    "#bbbbbbbbbbbbbb#",
    "#bb#w#bbbb#w#bb#",
    "#bb#b#bbbb#b#bb#",
    ".#bbbb#yy#bbbb#.",
    "..#bbb####bbb#..",
    ".#bbbbbbbbbbbb#.",
    "#bb#cccccccc#bb#",
    "#bb#c#yyyy#c#bb#",
    ".#b#cccccccc#b#.",
    "..#bbbbbbbbbb#..",
    "...#yy#..#yy#...",
    "....##....##....",
    "................"
  ],
  chrono_aegolius: [
    "..#...####...#..",
    ".#b#.#bbbb#.#b#.",
    "#bbb#bbbbbb#bbb#",
    "#bb#c#bbbb#c#bb#",
    "#bb#w#bbbb#w#bb#",
    "#bb#b#bbbb#b#bb#",
    ".#bbbb#yy#bbbb#.",
    "#c#bbb####bbb#c#",
    "#c#bbbbbbbbbb#c#",
    "#c#b#yyyyyy#b#c#",
    ".#bb#y#cc#y#bb#.",
    "..#b#yyyyyy#b#..",
    "...#bbbbbbbb#...",
    "....#yy##yy#....",
    ".....##..##.....",
    "................"
  ],
  chrono_aegolius_idle1: [
    "..#...####...#..",
    ".#b#.#bbbb#.#b#.",
    "#bbb#bbbbbb#bbb#",
    "#bb#c#bbbb#c#bb#",
    "#bb#w#bbbb#w#bb#",
    "#bb#b#bbbb#b#bb#",
    ".#bbbb#yy#bbbb#.",
    "#c#bbb####bbb#c#",
    "#c#bbbbbbbbbb#c#",
    "#c#b#yyyyyy#b#c#",
    ".#bb#y#cc#y#bb#.",
    "..#b#yyyyyy#b#..",
    "...#bbbbbbbb#...",
    "....#yy##yy#....",
    ".....##..##.....",
    "................"
  ],
  komyo_chronos: [
    ".*..#..##..#..*.",
    ".*y#y#*yy*#y#y*.",
    "#yy#*#yyyy#*#yy#",
    "#yy#c#yyyy#c#yy#",
    "#yy#w#yyyy#w#yy#",
    "#yy#b#yyyy#b#yy#",
    ".#yyyy#ww#yyyy#.",
    "*#*yyy####yyy*#*",
    "#yy#*yyyyyy*#yy#",
    "#yy#y#wwww#y#yy#",
    ".#y#y#w**w#y#y#.",
    "..#y#ywwwwy#y#..",
    "...#yyyyyyyy#...",
    "....*#yy##yy#*..",
    ".....**..**.....",
    "................"
  ],
  komyo_chronos_idle1: [
    ".*..#..##..#..*.",
    ".*y#y#*yy*#y#y*.",
    "#yy#*#yyyy#*#yy#",
    "#yy#c#yyyy#c#yy#",
    "#yy#w#yyyy#w#yy#",
    "#yy#b#yyyy#b#yy#",
    ".#yyyy#ww#yyyy#.",
    "*#*yyy####yyy*#*",
    "#yy#*yyyyyy*#yy#",
    "#yy#y#wwww#y#yy#",
    ".#y#y#w**w#y#y#.",
    "..#y#ywwwwy#y#..",
    "...#yyyyyyyy#...",
    "....*#yy##yy#*..",
    ".....**..**.....",
    "................"
  ],
  egg_gaming: [
    ".....######.....",
    "...##kkkkkk##...",
    "..#kkrrrrrrkk#..",
    ".#kkrrrrrrrrkk#.",
    "#kkrrr#gg#rrrkk#",
    "#kkrr#gggg#rrkk#",
    "#kkrr#gggg#rrkk#",
    "#kkrrr#gg#rrrkk#",
    "#kkrrr#cc#rrrkk#",
    "#kkrr#cccc#rrkk#",
    "#kkrrr#cc#rrrkk#",
    ".#kkrrrrrrrrkk#.",
    "..#kkrrrrrrkk#..",
    "...##kkkkkk##...",
    ".....######.....",
    "................"
  ],
  egg_gaming_idle1: [
    ".....######.....",
    "...##kkkkkk##...",
    "..#kkrrrrrrkk#..",
    ".#kkrrrrrrrrkk#.",
    "#kkrrr#gg#rrrkk#",
    "#kkrr#gggg#rrkk#",
    "#kkrr#gggg#rrkk#",
    "#kkrrr#gg#rrrkk#",
    "#kkrrr#cc#rrrkk#",
    "#kkrr#cccc#rrkk#",
    "#kkrrr#cc#rrrkk#",
    ".#kkrrrrrrrrkk#.",
    "..#kkrrrrrrkk#..",
    "...##kkkkkk##...",
    ".....######.....",
    "................"
  ],
  arcade_wyrmling: [
    "....#......#....",
    "...#y#....#y#...",
    "..#rrr####rrr#..",
    ".#rrrrrrrrrrrr#.",
    ".#rr#b#rr#b#rr#.",
    ".#rrrrrrrrrrrr#.",
    "..#rrr####rrr#..",
    ".#rrrr#ss#rrrr#.",
    "#r#rrr#ss#rrr#r#",
    "#rr#rr#ss#rr#rr#",
    ".#rrrrssssrrrr#.",
    "..#rrrrrrrrrr#..",
    "...#rrrrrrrr#...",
    "....#rr#..#rr#..",
    ".....##....##.#y",
    "...............#"
  ],
  arcade_wyrmling_idle1: [
    "....#......#....",
    "...#y#....#y#...",
    "..#rrr####rrr#..",
    ".#rrrrrrrrrrrr#.",
    ".#rr#b#rr#b#rr#.",
    ".#rrrrrrrrrrrr#.",
    "..#rrr####rrr#..",
    ".#rrrr#ss#rrrr#.",
    "#r#rrr#ss#rrr#r#",
    "#rr#rr#ss#rr#rr#",
    ".#rrrrssssrrrr#.",
    "..#rrrrrrrrrr#..",
    "...#rrrrrrrr#...",
    "....#rr#..#rr#..",
    ".....##....##.#y",
    "...............#"
  ],
  pixel_drake: [
    "...#........#...",
    "..#y#......#y#..",
    ".#rrr######rrr#.",
    "#rrrrrrrrrrrrrr#",
    "#rr#c#rrrr#c#rr#",
    "#rrrrrrrrrrrrrr#",
    ".#rrrr####rrrr#.",
    "#y#rrr#ss#rrr#y#",
    "#yy#rr#ss#rr#yy#",
    "#yy#rr#ss#rr#yy#",
    ".#rrrrssssrrrr#.",
    "..#rrrrrrrrrr#..",
    "...#rr#..#rr#...",
    "....##....##.#y#",
    ".............#yy",
    "..............##"
  ],
  pixel_drake_idle1: [
    "...#........#...",
    "..#y#......#y#..",
    ".#rrr######rrr#.",
    "#rrrrrrrrrrrrrr#",
    "#rr#c#rrrr#c#rr#",
    "#rrrrrrrrrrrrrr#",
    ".#rrrr####rrrr#.",
    "#y#rrr#ss#rrr#y#",
    "#yy#rr#ss#rr#yy#",
    "#yy#rr#ss#rr#yy#",
    ".#rrrrssssrrrr#.",
    "..#rrrrrrrrrr#..",
    "...#rr#..#rr#...",
    "....##....##.#y#",
    ".............#yy",
    "..............##"
  ],
  combo_wyvern: [
    "..#...####...#..",
    ".#y#.#rrrr#.#y#.",
    "#yy#rrrrrrrr#yy#",
    "#yy#r#c##c#r#yy#",
    ".#rrrrrrrrrrrr#.",
    "..#rrr####rrr#..",
    "#c#rrr#ss#rrr#c#",
    "#cc#rr#ss#rr#cc#",
    "#cc#rssssssr#cc#",
    ".#c#rssssssr#c#.",
    "..#rrrrrrrrrr#..",
    "...#rr#..#rr#...",
    "....##....##.#y#",
    "............#yy#",
    "...........#yyy#",
    "............###."
  ],
  combo_wyvern_idle1: [
    "..#...####...#..",
    ".#y#.#rrrr#.#y#.",
    "#yy#rrrrrrrr#yy#",
    "#yy#r#c##c#r#yy#",
    ".#rrrrrrrrrrrr#.",
    "..#rrr####rrr#..",
    "#c#rrr#ss#rrr#c#",
    "#cc#rr#ss#rr#cc#",
    "#cc#rssssssr#cc#",
    ".#c#rssssssr#c#.",
    "..#rrrrrrrrrr#..",
    "...#rr#..#rr#...",
    "....##....##.#y#",
    "............#yy#",
    "...........#yyy#",
    "............###."
  ],
  shinryu_master: [
    "..#...#....#...#",
    ".#y#.#g#.#g#.#y#",
    "#yy###gg#gg###yy",
    "#yy#gggggggg#yy#",
    ".#gg#c#gggg#c#gg",
    ".#gggggggggggg#.",
    "..#ggg#wwww#gg#.",
    "#c#ggg#wwww#gg#.",
    "#cc#gggggggggg#.",
    ".#cc#ggg##ggg#..",
    "..#gggg#..#gggg#",
    ".#gggg#..#gggg#.",
    "#gggg#....#ggg#.",
    "#ggg#......#gg#.",
    ".#g#........#g#.",
    "..#..........#.."
  ],
  shinryu_master_idle1: [
    "..#...#....#...#",
    ".#y#.#g#.#g#.#y#",
    "#yy###gg#gg###yy",
    "#yy#gggggggg#yy#",
    ".#gg#c#gggg#c#gg",
    ".#gggggggggggg#.",
    "..#ggg#wwww#gg#.",
    "#c#ggg#wwww#gg#.",
    "#cc#gggggggggg#.",
    ".#cc#ggg##ggg#..",
    "..#gggg#..#gggg#",
    ".#gggg#..#gggg#.",
    "#gggg#....#ggg#.",
    "#ggg#......#gg#.",
    ".#g#........#g#.",
    "..#..........#.."
  ],
  komyo_shinryu: [
    ".*..#..##..#..*.",
    ".*y#y#*yy*#y#y*.",
    "#yy###yyyy###yy#",
    "#yy#*yyyyyy*#yy#",
    "#yy#c#yyyy#c#yy#",
    "#yyyyyyyyyyyyyy#",
    ".#yyyy#wwww#yy#.",
    "*#*yyy#wwww#yy#*",
    "#yy#*yyyyyy*#yy#",
    ".#yy#yyyyyyyy#..",
    "..#yyyy#..#yyyy#",
    ".#yyyy#..#yyyy#.",
    "#yyyy#....#yyy#.",
    "#yyy#......#yy#.",
    ".#y#........#y#.",
    "..*..........*.."
  ],
  komyo_shinryu_idle1: [
    ".*..#..##..#..*.",
    ".*y#y#*yy*#y#y*.",
    "#yy###yyyy###yy#",
    "#yy#*yyyyyy*#yy#",
    "#yy#c#yyyy#c#yy#",
    "#yyyyyyyyyyyyyy#",
    ".#yyyy#wwww#yy#.",
    "*#*yyy#wwww#yy#*",
    "#yy#*yyyyyy*#yy#",
    ".#yy#yyyyyyyy#..",
    "..#yyyy#..#yyyy#",
    ".#yyyy#..#yyyy#.",
    "#yyyy#....#yyy#.",
    "#yyy#......#yy#.",
    ".#y#........#y#.",
    "..*..........*.."
  ],
  egg_personal: [
    ".....######.....",
    "...##ssssss##...",
    "..#ssssssssss#..",
    ".#ssssssssssss#.",
    "#ssssss##ssssss#",
    "#sssss#rr#sssss#",
    "#ssss#rrrr#ssss#",
    "#ssss#ryyr#ssss#",
    "#ssss#rrrr#ssss#",
    "#sssss#rr#sssss#",
    "#ssssss##ssssss#",
    ".#ssssssssssss#.",
    "..#ssssssssss#..",
    "...##ssssss##...",
    ".....######.....",
    "................"
  ],
  egg_personal_idle1: [
    ".....######.....",
    "...##ssssss##...",
    "..#ssssssssss#..",
    ".#ssssssssssss#.",
    "#ssssss##ssssss#",
    "#sssss#rr#sssss#",
    "#ssss#rrrr#ssss#",
    "#ssss#ryyr#ssss#",
    "#ssss#rrrr#ssss#",
    "#sssss#rr#sssss#",
    "#ssssss##ssssss#",
    ".#ssssssssssss#.",
    "..#ssssssssss#..",
    "...##ssssss##...",
    ".....######.....",
    "................"
  ],
  loyal_pup: [
    "..#..........#..",
    ".#s#...##...#s#.",
    "#sss###ss###sss#",
    "#ss#b#ssss#b#ss#",
    "#ssssssssssssss#",
    "#ssss#bbbb#ssss#",
    ".#sss#bbbb#sss#.",
    ".#rrrrrrrrrrrr#.",
    "#rr#ssssssss#rr#",
    "#r#ssssssssss#r#",
    ".#ssssssssssss#.",
    "..#ssss##ssss#..",
    "..#ss#....#ss#..",
    "...##......##.#s",
    "..............#s",
    "...............#"
  ],
  loyal_pup_idle1: [
    "..#..........#..",
    ".#s#...##...#s#.",
    "#sss###ss###sss#",
    "#ss#b#ssss#b#ss#",
    "#ssssssssssssss#",
    "#ssss#bbbb#ssss#",
    ".#sss#bbbb#sss#.",
    ".#rrrrrrrrrrrr#.",
    "#rr#ssssssss#rr#",
    "#r#ssssssssss#r#",
    ".#ssssssssssss#.",
    "..#ssss##ssss#..",
    "..#ss#....#ss#..",
    "...##......##.#s",
    "..............#s",
    "...............#"
  ],
  zen_shiba: [
    "..#..........#..",
    ".#s#...##...#s#.",
    "#sss###ss###sss#",
    "#ss#b#ssss#b#ss#",
    "#ssssssssssssss#",
    "#ssss#bbbb#ssss#",
    ".#sss#bbbb#sss#.",
    "..#sss####sss#..",
    ".#ssssssssssss#.",
    "#ss#vvvvvvvv#ss#",
    "#ss#vv#yy#vv#ss#",
    "#ss#vvvvvvvv#ss#",
    ".#ssssssssssss#.",
    "..#ssssssssss#..",
    "...##########...",
    "................"
  ],
  zen_shiba_idle1: [
    "..#..........#..",
    ".#s#...##...#s#.",
    "#sss###ss###sss#",
    "#ss#b#ssss#b#ss#",
    "#ssssssssssssss#",
    "#ssss#bbbb#ssss#",
    ".#sss#bbbb#sss#.",
    "..#sss####sss#..",
    ".#ssssssssssss#.",
    "#ss#vvvvvvvv#ss#",
    "#ss#vv#yy#vv#ss#",
    "#ss#vvvvvvvv#ss#",
    ".#ssssssssssss#.",
    "..#ssssssssss#..",
    "...##########...",
    "................"
  ],
  guardian_inu: [
    "..#..........#..",
    ".#s#...##...#s#.",
    "#sss###ss###sss#",
    "#ss#b#ssss#b#ss#",
    "#ssssssssssssss#",
    "#ssss#bbbb#ssss#",
    ".#sss#bbbb#sss#.",
    "..#sss####sss#..",
    ".#rr#ssssss#rr#.",
    "#rrrr#ssss#rrrr#",
    "#rrrr#yyyy#rrrr#",
    "#rrrr#yyyy#rrrr#",
    ".#ss#ssssss#ss#.",
    "..#ss#....#ss#..",
    "...##......##.#s",
    "..............##"
  ],
  guardian_inu_idle1: [
    "..#..........#..",
    ".#s#...##...#s#.",
    "#sss###ss###sss#",
    "#ss#b#ssss#b#ss#",
    "#ssssssssssssss#",
    "#ssss#bbbb#ssss#",
    ".#sss#bbbb#sss#.",
    "..#sss####sss#..",
    ".#rr#ssssss#rr#.",
    "#rrrr#ssss#rrrr#",
    "#rrrr#yyyy#rrrr#",
    "#rrrr#yyyy#rrrr#",
    ".#ss#ssssss#ss#.",
    "..#ss#....#ss#..",
    "...##......##.#s",
    "..............##"
  ],
  komainu_celestial: [
    "..##...##...##..",
    ".#ss#.#ss#.#ss#.",
    "#ssss#ssss#ssss#",
    "#sss#b#ss#b#sss#",
    "#ssssssssssssss#",
    "#sss#bbbbbb#sss#",
    ".#ss#b#ww#b#ss#.",
    "..#ss#bbbb#ss#..",
    ".#rr#wwwwww#rr#.",
    "#rrrr#wwww#rrrr#",
    "#rrrr#yyyy#rrrr#",
    "#rrrr#yyyy#rrrr#",
    ".#sss#ssss#sss#.",
    "..#ss#....#ss#..",
    "..#ss#....#ss#..",
    "...##......##..."
  ],
  komainu_celestial_idle1: [
    "..##...##...##..",
    ".#ss#.#ss#.#ss#.",
    "#ssss#ssss#ssss#",
    "#sss#b#ss#b#sss#",
    "#ssssssssssssss#",
    "#sss#bbbbbb#sss#",
    ".#ss#b#ww#b#ss#.",
    "..#ss#bbbb#ss#..",
    ".#rr#wwwwww#rr#.",
    "#rrrr#wwww#rrrr#",
    "#rrrr#yyyy#rrrr#",
    "#rrrr#yyyy#rrrr#",
    ".#sss#ssss#sss#.",
    "..#ss#....#ss#..",
    "..#ss#....#ss#..",
    "...##......##..."
  ],
  komyo_komainu: [
    ".*..#..##..#..*.",
    ".*y#y#*yy*#y#y*.",
    "#yyy#*yyyy*#yyy#",
    "#yyy#b#yy#b#yyy#",
    "#yyyyyyyyyyyyyy#",
    "#yyy#bbbbbb#yyy#",
    ".#yy#b#ww#b#yy#.",
    "*#*yy#bbbb#yy*#*",
    "#yy#y#wwww#y#yy#",
    "#yyy#*yyyy*#yyy#",
    ".#yyyyyyyyyyyy#.",
    "..#yy#*..*#yy#..",
    "..#yy#....#yy#..",
    ".*#yy#....#yy#*.",
    "...##......##...",
    "....*......*...."
  ],
  komyo_komainu_idle1: [
    ".*..#..##..#..*.",
    ".*y#y#*yy*#y#y*.",
    "#yyy#*yyyy*#yyy#",
    "#yyy#b#yy#b#yyy#",
    "#yyyyyyyyyyyyyy#",
    "#yyy#bbbbbb#yyy#",
    ".#yy#b#ww#b#yy#.",
    "*#*yy#bbbb#yy*#*",
    "#yy#y#wwww#y#yy#",
    "#yyy#*yyyy*#yyy#",
    ".#yyyyyyyyyyyy#.",
    "..#yy#*..*#yy#..",
    "..#yy#....#yy#..",
    ".*#yy#....#yy#*.",
    "...##......##...",
    "....*......*...."
  ],
};

// Color palettes for sprite pixel chars
const SPRITE_PALETTES = {
  default: {
    '#': '#0f380f', // outline
    '.': 'transparent',
    'y': '#ffd700', // yellow/gold
    'c': '#00f0ff', // cyan
    'g': '#306230', // green
    'v': '#9966cc', // violet
    'p': '#ba55d3', // purple
    'r': '#ff6b81', // pink/rose/red
    's': '#ffeaa7', // soft cream
    'b': '#2d3436', // dark/slate
    'w': '#f1f2f6', // white
    'z': '#70a1ff', // sleep zzz blue
    '*': '#ffeaa7', // sparkle
    'k': '#2f3542', // slate glitch
    'B': '#ff7675', // happy cheek blush
    'S': '#ff9ff3', // sweet blush glow
    'G': '#e17055'  // grumpy brow / irritation puff
  },
  classic_default: {
    '#': '#0f380f',
    '.': 'transparent',
    'y': '#ffd700',
    'c': '#00f0ff',
    'g': '#306230',
    'v': '#9966cc',
    'p': '#ba55d3',
    'r': '#ff6b81',
    's': '#ffeaa7',
    'b': '#2d3436',
    'w': '#f1f2f6',
    'z': '#70a1ff',
    '*': '#ffeaa7',
    'k': '#2f3542',
    'B': '#ff7675',
    'S': '#ff9ff3',
    'G': '#e17055'
  },
  neon_cyber: {
    '#': '#050510',
    '.': 'transparent',
    'y': '#00ffcc', // neon teal
    'c': '#00f0ff', // electric cyan
    'g': '#39ff14', // neon green
    'v': '#bf00ff', // electric violet
    'p': '#ff007f', // hot neon pink
    'r': '#ff3366', // laser red
    's': '#e0ffff', // light cyan aura
    'b': '#111827',
    'w': '#ffffff',
    'z': '#38bdf8',
    '*': '#f0abfc',
    'k': '#0f172a',
    'B': '#ff007f',
    'S': '#f472b6',
    'G': '#ef4444'
  },
  sakura_pastel: {
    '#': '#4a2835',
    '.': 'transparent',
    'y': '#fff0f5', // lavender blush
    'c': '#e0f2fe', // soft cloud blue
    'g': '#bbf7d0', // mint pastel
    'v': '#f3e8ff', // pale lilac
    'p': '#fbcfe8', // pastel orchid
    'r': '#fda4af', // cherry blossom rose
    's': '#fff1f2', // sakura cream
    'b': '#581c87', // rich plum
    'w': '#ffffff',
    'z': '#bae6fd',
    '*': '#fef08a',
    'k': '#64748b',
    'B': '#f43f5e',
    'S': '#fb7185',
    'G': '#e11d48'
  },
  solar_gold: {
    '#': '#451a03',
    '.': 'transparent',
    'y': '#fbbf24', // radiant gold
    'c': '#fef08a', // sunbeam yellow
    'g': '#d97706', // amber green
    'v': '#f59e0b', // warm amber
    'p': '#b45309', // burnt gold
    'r': '#ea580c', // solar flare red
    's': '#fef3c7', // glowing cream
    'b': '#78350f', // deep bronze
    'w': '#ffffff',
    'z': '#fde68a',
    '*': '#ffffff',
    'k': '#92400e',
    'B': '#f97316',
    'S': '#fb923c',
    'G': '#c2410c'
  },
  abyssal_shadow: {
    '#': '#020617',
    '.': 'transparent',
    'y': '#64748b', // ghostly slate
    'c': '#38bdf8', // ethereal soul blue
    'g': '#10b981', // phantom teal
    'v': '#818cf8', // twilight indigo
    'p': '#a855f7', // abyssal violet
    'r': '#f43f5e', // crimson eye
    's': '#1e293b', // shadow dark
    'b': '#0f172a', // void black
    'w': '#e2e8f0', // spectral white
    'z': '#0284c7',
    '*': '#67e8f9',
    'k': '#090d16',
    'B': '#9333ea',
    'S': '#c084fc',
    'G': '#dc2626'
  },
  celestial_shiny: {
    '#': '#1e1b4b',
    '.': 'transparent',
    'y': '#fef08a', // starlight shimmer
    'c': '#67e8f9', // diamond cyan
    'g': '#86efac', // aurora green
    'v': '#c084fc', // celestial violet
    'p': '#f472b6', // supernova pink
    'r': '#fb7185', // rose nebula
    's': '#f8fafc', // pure diamond white
    'b': '#312e81', // cosmic night
    'w': '#ffffff', // blinding white
    'z': '#93c5fd',
    '*': '#fef9c3', // bright twinkle
    'k': '#4338ca',
    'B': '#ec4899',
    'S': '#f43f5e',
    'G': '#e11d48'
  }
};

/**
 * Mapping of 36 breed creature IDs to their pixel art sprite grid keys
 */
const CREATURE_SPRITE_KEY_MAP = {
  // ⚡ Coding (Cat Lineage)
  coding_tamago: 'egg_denki',
  coding_baby: 'pikoneko',
  coding_child: 'kikai_neko',
  coding_teen: 'bit_panther',
  coding_adult: 'raijin_nekomata',
  coding_radiant: 'komyo_raijin',

  // 🎨 Creative (Bird Lineage)
  creative_tamago: 'egg_creative',
  creative_baby: 'feather_pip',
  creative_child: 'prism_finch',
  creative_teen: 'origami_crane',
  creative_adult: 'suzaku_phoenix',
  creative_radiant: 'komyo_suzaku',

  // 📜 Literature (Fox Lineage)
  literature_tamago: 'egg_literature',
  literature_baby: 'ink_kit',
  literature_child: 'scroll_fox',
  literature_teen: 'mystic_kitsune',
  literature_adult: 'inari_tenko',
  literature_radiant: 'komyo_kyubi',

  // 🦉 Research (Owl Lineage)
  research_tamago: 'egg_research',
  research_baby: 'curious_owlet',
  research_child: 'scholar_owl',
  research_teen: 'sage_strigid',
  research_adult: 'chrono_aegolius',
  research_radiant: 'komyo_chronos',

  // 🐉 Gaming (Dragon Lineage)
  gaming_tamago: 'egg_gaming',
  gaming_baby: 'arcade_wyrmling',
  gaming_child: 'pixel_drake',
  gaming_teen: 'combo_wyvern',
  gaming_adult: 'shinryu_master',
  gaming_radiant: 'komyo_shinryu',

  // 🐕 Personal Development (Shiba Inu Lineage)
  personal_tamago: 'egg_personal',
  personal_baby: 'loyal_pup',
  personal_child: 'zen_shiba',
  personal_teen: 'guardian_inu',
  personal_adult: 'komainu_celestial',
  personal_radiant: 'komyo_komainu',

  // Legacy mappings
  glitch_golem: 'bit_panther',
  raijin_drake: 'raijin_nekomata',
  fukuro_ko: 'curious_owlet',
  owl_mage: 'scholar_owl',
  hoshi_sphinx: 'sage_strigid',
  hoshi_no_kenja: 'chrono_aegolius',
  komyo_kenja: 'komyo_chronos',
  kotoba_kitsune: 'scroll_fox',
  monogatari_kitsune: 'inari_tenko',
  komyo_kitsune: 'komyo_kyubi',
  hane_no_ryu: 'combo_wyvern',
  mochi_blob: 'loyal_pup'
};

/**
 * Generates an idle3 receptive frame with sparkling particles for higher evolutions
 */
export function createIdle3Grid(baseGrid) {
  const newGrid = baseGrid.map(row => row.split(''));
  const h = newGrid.length;
  const w = newGrid[0].length;

  // Sparkles in corners or above shoulders
  if (newGrid[1] && newGrid[1][1] === '.') newGrid[1][1] = '*';
  if (newGrid[2] && newGrid[2][w - 2] === '.') newGrid[2][w - 2] = '*';
  if (newGrid[h - 3] && newGrid[h - 3][1] === '.') newGrid[h - 3][1] = '*';
  if (newGrid[h - 2] && newGrid[h - 2][w - 2] === '.') newGrid[h - 2][w - 2] = '*';

  return newGrid.map(r => r.join(''));
}

/**
 * Creates a blushing, happy-squint variant of any creature grid when petted
 */
export function createPettedGrid(baseGrid) {
  const newGrid = baseGrid.map(row => row.split(''));
  const h = newGrid.length;
  const w = newGrid[0].length;

  const blushY = Math.min(h - 4, Math.max(5, Math.floor(h * 0.48)));
  [blushY, blushY + 1].forEach(y => {
    if (newGrid[y]) {
      for (let x = 2; x <= 4; x++) {
        if (newGrid[y][x] && newGrid[y][x] !== '.' && newGrid[y][x] !== '#') {
          newGrid[y][x] = 'B';
        }
      }
      for (let x = w - 5; x <= w - 3; x++) {
        if (newGrid[y][x] && newGrid[y][x] !== '.' && newGrid[y][x] !== '#') {
          newGrid[y][x] = 'B';
        }
      }
    }
  });

  const eyeY = blushY - 1;
  if (newGrid[eyeY]) {
    for (let x = 3; x <= w - 4; x++) {
      if (newGrid[eyeY][x] === 'b' || newGrid[eyeY][x] === 'w') {
        newGrid[eyeY][x] = '#';
      }
    }
  }

  return newGrid.map(r => r.join(''));
}

/**
 * Creates a grumpy, furrowed-brow variant of any creature grid when neglected
 */
export function createGrumpyGrid(baseGrid) {
  const newGrid = baseGrid.map(row => row.split(''));
  const h = newGrid.length;
  const w = newGrid[0].length;

  const eyeY = Math.min(h - 5, Math.max(5, Math.floor(h * 0.42)));
  const browY = Math.max(1, eyeY - 1);
  const mouthY = Math.min(h - 3, eyeY + 2);

  // 1. Furrowed downward slanting brows: \  /
  if (newGrid[browY]) {
    // Left eyebrow slanting down towards center
    for (let x = 3; x <= 5; x++) {
      if (newGrid[browY][x] && newGrid[browY][x] !== '.') {
        newGrid[browY][x] = '#';
      }
    }
    // Right eyebrow slanting down towards center
    for (let x = w - 6; x <= w - 4; x++) {
      if (newGrid[browY][x] && newGrid[browY][x] !== '.') {
        newGrid[browY][x] = '#';
      }
    }
  }

  // 2. Grumpy sharp eyes: > <
  if (newGrid[eyeY]) {
    for (let x = 3; x <= w - 4; x++) {
      if (newGrid[eyeY][x] === 'b' || newGrid[eyeY][x] === 'w') {
        newGrid[eyeY][x] = '#';
      }
    }
  }

  // 3. Pouty / zig-zag mouth or downturned frown
  if (newGrid[mouthY]) {
    const midX = Math.floor(w / 2);
    if (newGrid[mouthY][midX - 1] && newGrid[mouthY][midX - 1] !== '.') newGrid[mouthY][midX - 1] = '#';
    if (newGrid[mouthY][midX] && newGrid[mouthY][midX] !== '.') newGrid[mouthY][midX] = '#';
    if (newGrid[mouthY][midX + 1] && newGrid[mouthY][midX + 1] !== '.') newGrid[mouthY][midX + 1] = '#';
  }

  // 4. Little puff of grumpy irritation in top-right corner
  if (newGrid[1] && newGrid[1][w - 3] === '.') newGrid[1][w - 3] = 'G';
  if (newGrid[1] && newGrid[1][w - 2] === '.') newGrid[1][w - 2] = 'G';

  return newGrid.map(r => r.join(''));
}

/**
 * Creates a hungry, pleading variant of any creature grid with drool pixel
 */
export function createHungryGrid(baseGrid) {
  const newGrid = baseGrid.map(row => row.split(''));
  const h = newGrid.length;
  const w = newGrid[0].length;

  const eyeY = Math.min(h - 5, Math.max(5, Math.floor(h * 0.42)));
  const mouthY = Math.min(h - 3, eyeY + 2);

  // Sparkling pleading eyes
  if (newGrid[eyeY]) {
    for (let x = 3; x <= w - 4; x++) {
      if (newGrid[eyeY][x] === 'b' || newGrid[eyeY][x] === '#') {
        newGrid[eyeY][x] = 'w';
      }
    }
  }

  // Drool drop at mouth corner
  if (newGrid[mouthY]) {
    const midX = Math.floor(w / 2);
    if (newGrid[mouthY][midX]) newGrid[mouthY][midX] = '#';
    if (newGrid[mouthY + 1] && newGrid[mouthY + 1][midX + 1]) {
      newGrid[mouthY + 1][midX + 1] = 'c';
    }
  }

  return newGrid.map(r => r.join(''));
}

/**
 * Creates a procrastinating / weary sweat-drop variant of any creature grid
 */
export function createProcrastinatingGrid(baseGrid) {
  const newGrid = baseGrid.map(row => row.split(''));
  const h = newGrid.length;
  const w = newGrid[0].length;

  const eyeY = Math.min(h - 5, Math.max(5, Math.floor(h * 0.42)));
  const browY = Math.max(1, eyeY - 1);

  // Weary heavy eyelids
  if (newGrid[browY]) {
    for (let x = 3; x <= w - 4; x++) {
      if (newGrid[browY][x] && newGrid[browY][x] !== '.') {
        newGrid[browY][x] = '#';
      }
    }
  }

  // Sweat drop on upper right
  if (newGrid[2] && newGrid[2][w - 3] === '.') newGrid[2][w - 3] = 'c';
  if (newGrid[3] && newGrid[3][w - 3] === '.') newGrid[3][w - 3] = 'c';

  return newGrid.map(r => r.join(''));
}

// Memoization cache to avoid recalculating 256 SVG pixels on every 450ms animation tick
const spriteCache = new Map();

/**
 * Accessor to get an SVG data URI for a creature and animation frame
 */
export function getCreatureSprite(creatureId, action = 'idle1', accessory = 'none', theme = 'classic_default') {
  const cacheKey = `${creatureId}_${action}_${accessory}_${theme}`;
  if (spriteCache.has(cacheKey)) {
    return spriteCache.get(cacheKey);
  }

  const palette = SPRITE_PALETTES[theme] || SPRITE_PALETTES.default;
  const mappedId = (typeof CREATURE_SPRITE_KEY_MAP !== 'undefined' && CREATURE_SPRITE_KEY_MAP[creatureId]) ? CREATURE_SPRITE_KEY_MAP[creatureId] : creatureId;

  if (action === 'petted') {
    const baseKey = `${mappedId}_idle1`;
    const baseGrid = GRIDS[baseKey] || GRIDS[mappedId] || GRIDS[`${creatureId}_idle1`] || GRIDS[creatureId] || GRIDS.mochi_blob_idle1;
    const pettedGrid = createPettedGrid(baseGrid);
    const result = createPixelSvg(pettedGrid[0].length, pettedGrid.length, pettedGrid, palette);
    spriteCache.set(cacheKey, result);
    return result;
  }

  if (action === 'grumpy') {
    const baseKey = `${mappedId}_idle1`;
    const baseGrid = GRIDS[baseKey] || GRIDS[mappedId] || GRIDS[`${creatureId}_idle1`] || GRIDS[creatureId] || GRIDS.mochi_blob_idle1;
    const grumpyGrid = createGrumpyGrid(baseGrid);
    const result = createPixelSvg(grumpyGrid[0].length, grumpyGrid.length, grumpyGrid, palette);
    spriteCache.set(cacheKey, result);
    return result;
  }

  if (action === 'hungry') {
    const baseKey = `${mappedId}_idle1`;
    const baseGrid = GRIDS[baseKey] || GRIDS[mappedId] || GRIDS[`${creatureId}_idle1`] || GRIDS[creatureId] || GRIDS.mochi_blob_idle1;
    const hungryGrid = createHungryGrid(baseGrid);
    const result = createPixelSvg(hungryGrid[0].length, hungryGrid.length, hungryGrid, palette);
    spriteCache.set(cacheKey, result);
    return result;
  }

  if (action === 'procrastinating') {
    const baseKey = `${mappedId}_idle1`;
    const baseGrid = GRIDS[baseKey] || GRIDS[mappedId] || GRIDS[`${creatureId}_idle1`] || GRIDS[creatureId] || GRIDS.mochi_blob_idle1;
    const procGrid = createProcrastinatingGrid(baseGrid);
    const result = createPixelSvg(procGrid[0].length, procGrid.length, procGrid, palette);
    spriteCache.set(cacheKey, result);
    return result;
  }

  if (action === 'idle3') {
    const baseKey = `${mappedId}_idle1`;
    const baseGrid = GRIDS[`${mappedId}_idle3`] || GRIDS[baseKey] || GRIDS[mappedId] || GRIDS.mochi_blob_idle1;
    const idle3Grid = createIdle3Grid(baseGrid);
    const result = createPixelSvg(idle3Grid[0].length, idle3Grid.length, idle3Grid, palette);
    spriteCache.set(cacheKey, result);
    return result;
  }

  // Map creature + action to grid
  let key = `${mappedId}_${action}`;
  if (!GRIDS[key]) {
    key = `${creatureId}_${action}`;
    if (!GRIDS[key]) {
      key = `${mappedId}_idle1`;
      if (!GRIDS[key]) {
        key = `${creatureId}_idle1`;
        if (!GRIDS[key]) {
          key = mappedId;
          if (!GRIDS[key]) key = creatureId;
        }
      }
    }
  }

  const grid = GRIDS[key] || GRIDS.mochi_blob_idle1;
  const height = grid.length;
  const width = grid[0].length;

  const result = createPixelSvg(width, height, grid, palette);
  spriteCache.set(cacheKey, result);
  return result;
}

/**
 * Accessory SVG overlays
 */
export function getAccessorySvg(accessoryId) {
  if (!accessoryId || accessoryId === 'none') return null;

  const ACC_GRIDS = {
    hachimaki: [
      "................",
      "................",
      "................",
      "....#######.....",
      "...#rrrrrrr#....",
      "..#rr#www#rr#...",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    tanuki_leaf: [
      "................",
      "......#g#.......",
      ".....#ggg#......",
      "......#g#.......",
      ".......#........",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    retro_glasses: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "...#####.#####..",
      "..#cwwc#-#cwwc#.",
      "..#cccc#.#cccc#.",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    cozy_scarf: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "...###########..",
      "..#rrrrrrrrrrr#.",
      "..#r#ww#r#ww#r#.",
      "...#rr##...##...",
      "....##..........",
      "................",
      "................",
      "................"
    ],
    wizard_hat: [
      ".......#........",
      "......#p#.......",
      ".....#ppp#......",
      "....#ppppp#.....",
      "...#yy*yyyy#....",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    cyber_visor: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "...#########....",
      "..#ccccccccc#...",
      "..#c*cc*cc*c#...",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    ninja_cowl: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "..###########...",
      "..#bbbbbbbbb#...",
      "..#bbbbbbbbb#...",
      "...#########....",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    red_cape: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "..#y#.....#y#...",
      ".#rrr#####rrr#..",
      ".#rrrrrrrrrrr#..",
      "#rrrrrrrrrrrrr#.",
      "#rrrr.rrr.rrrr#.",
      ".###...#...###..",
      "................",
      "................"
    ],
    samurai_helm: [
      "....#y#...#y#...",
      ".....#y#.#y#....",
      "......#yyy#.....",
      "....#########...",
      "...#bbbbbbbbb#..",
      "..#bb#yyyyy#bb#.",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    golden_crown: [
      "..#...#...#.....",
      ".#y#.#y#.#y#....",
      ".#yyyyyyyyy#....",
      "..#########.....",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ]
  };

  const grid = ACC_GRIDS[accessoryId];
  if (!grid) return null;

  return createPixelSvg(16, 16, grid, SPRITE_PALETTES.default);
}
