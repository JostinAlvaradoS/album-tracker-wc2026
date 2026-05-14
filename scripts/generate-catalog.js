/**
 * Generador del catálogo del álbum Panini FIFA World Cup 2026
 * -----------------------------------------------------------
 * Produce catalog.json listo para importar a Firestore.
 *
 * El layout de cada selección es CONFIGURABLE: ajusta TEAM_LAYOUT
 * según tu edición del álbum sin tocar el resto del código.
 *
 * Uso:  node generate-catalog.js
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 1. CONFIGURACIÓN — AJUSTA ESTO A TU EDICIÓN
// ============================================================

// slotsPerTeam: cuántos cromos tiene cada selección
// emblemSlot:   número de slot que es el escudo
// teamPhotoSlot: número de slot que es la foto del equipo
// el resto se rellenan como "Jugador N"
const TEAM_LAYOUT = {
  slotsPerTeam: 21,     // <-- cámbialo si son 20, 19, etc.
  emblemSlot: 1,        // MEX1 = escudo
  teamPhotoSlot: 13,    // MEX13 = foto del equipo
};

// Las 48 selecciones. El "code" es el prefijo del cromo (MEX1, ARG1...).
// Ajusta nombres/orden a tu álbum. group es informativo.
const TEAMS = [
  { id: 'mex', code: 'MEX', name: 'México',            group: 'A' },
  { id: 'can', code: 'CAN', name: 'Canadá',            group: 'B' },
  { id: 'usa', code: 'USA', name: 'Estados Unidos',    group: 'D' },
  { id: 'arg', code: 'ARG', name: 'Argentina',         group: '?' },
  { id: 'bra', code: 'BRA', name: 'Brasil',            group: '?' },
  { id: 'ecu', code: 'ECU', name: 'Ecuador',           group: '?' },
  { id: 'uru', code: 'URU', name: 'Uruguay',           group: '?' },
  { id: 'col', code: 'COL', name: 'Colombia',          group: '?' },
  { id: 'par', code: 'PAR', name: 'Paraguay',          group: '?' },
  { id: 'esp', code: 'ESP', name: 'España',            group: '?' },
  { id: 'fra', code: 'FRA', name: 'Francia',           group: '?' },
  { id: 'eng', code: 'ENG', name: 'Inglaterra',        group: '?' },
  { id: 'ger', code: 'GER', name: 'Alemania',          group: '?' },
  { id: 'por', code: 'POR', name: 'Portugal',          group: '?' },
  { id: 'ned', code: 'NED', name: 'Países Bajos',      group: '?' },
  { id: 'bel', code: 'BEL', name: 'Bélgica',           group: '?' },
  { id: 'cro', code: 'CRO', name: 'Croacia',           group: '?' },
  { id: 'ita', code: 'ITA', name: 'Italia',            group: '?' },
  { id: 'sui', code: 'SUI', name: 'Suiza',             group: '?' },
  { id: 'aut', code: 'AUT', name: 'Austria',           group: '?' },
  { id: 'sco', code: 'SCO', name: 'Escocia',           group: '?' },
  { id: 'nor', code: 'NOR', name: 'Noruega',           group: '?' },
  { id: 'tur', code: 'TUR', name: 'Turquía',           group: '?' },
  { id: 'ukr', code: 'UKR', name: 'Ucrania',           group: '?' },
  { id: 'jpn', code: 'JPN', name: 'Japón',             group: '?' },
  { id: 'kor', code: 'KOR', name: 'Corea del Sur',     group: '?' },
  { id: 'irn', code: 'IRN', name: 'Irán',              group: '?' },
  { id: 'ksa', code: 'KSA', name: 'Arabia Saudí',      group: '?' },
  { id: 'aus', code: 'AUS', name: 'Australia',         group: '?' },
  { id: 'qat', code: 'QAT', name: 'Catar',             group: '?' },
  { id: 'uzb', code: 'UZB', name: 'Uzbekistán',        group: '?' },
  { id: 'jor', code: 'JOR', name: 'Jordania',          group: '?' },
  { id: 'mar', code: 'MAR', name: 'Marruecos',         group: '?' },
  { id: 'sen', code: 'SEN', name: 'Senegal',           group: '?' },
  { id: 'tun', code: 'TUN', name: 'Túnez',             group: '?' },
  { id: 'egy', code: 'EGY', name: 'Egipto',            group: '?' },
  { id: 'alg', code: 'ALG', name: 'Argelia',           group: '?' },
  { id: 'gha', code: 'GHA', name: 'Ghana',             group: '?' },
  { id: 'civ', code: 'CIV', name: 'Costa de Marfil',   group: '?' },
  { id: 'cmr', code: 'CMR', name: 'Camerún',           group: '?' },
  { id: 'rsa', code: 'RSA', name: 'Sudáfrica',         group: '?' },
  { id: 'cpv', code: 'CPV', name: 'Cabo Verde',        group: '?' },
  { id: 'nzl', code: 'NZL', name: 'Nueva Zelanda',     group: '?' },
  { id: 'crc', code: 'CRC', name: 'Costa Rica',        group: '?' },
  { id: 'pan', code: 'PAN', name: 'Panamá',            group: '?' },
  { id: 'hai', code: 'HAI', name: 'Haití',             group: '?' },
  { id: 'cuw', code: 'CUW', name: 'Curazao',           group: '?' },
  { id: 'hon', code: 'HON', name: 'Honduras',          group: '?' },
];

// Secciones especiales con cromos definidos explícitamente.
// Cada cromo: { code, label, foil? }
// Edita los label de FWC9..FWC19 cuando tengas el detalle.
const SPECIAL_SECTIONS = [
  {
    id: 'intro',
    type: 'intro',
    name: 'Introducción',
    stickers: [
      { code: '00', label: 'Logo Panini', foil: false },
    ],
  },
  {
    id: 'fwc',
    type: 'special',
    name: 'FIFA World Cup 2026',
    stickers: [
      { code: 'FWC1',  label: 'Official Emblem',          foil: false },
      { code: 'FWC2',  label: 'Official Emblem',          foil: false },
      { code: 'FWC3',  label: 'Official Mascots',         foil: false },
      { code: 'FWC4',  label: 'Official Slogan',          foil: false },
      { code: 'FWC5',  label: 'Official Ball',            foil: false },
      { code: 'FWC6',  label: 'Trophy',                   foil: false },
      { code: 'FWC7',  label: 'Host Country Emblem',      foil: false },
      { code: 'FWC8',  label: 'Host Country Emblem',      foil: false },
      // FWC9-FWC19: selecciones campeonas. Ajusta el país de cada
      // slot según tu álbum (el orden exacto puede variar).
      { code: 'FWC9',  label: 'Selección campeona 1',     foil: false },
      { code: 'FWC10', label: 'Selección campeona 2',     foil: false },
      { code: 'FWC11', label: 'Selección campeona 3',     foil: false },
      { code: 'FWC12', label: 'Selección campeona 4',     foil: false },
      { code: 'FWC13', label: 'Selección campeona 5',     foil: false },
      { code: 'FWC14', label: 'Selección campeona 6',     foil: false },
      { code: 'FWC15', label: 'Selección campeona 7',     foil: false },
      { code: 'FWC16', label: 'Selección campeona 8',     foil: false },
      { code: 'FWC17', label: 'Selección campeona 9',     foil: false },
      { code: 'FWC18', label: 'Selección campeona 10',    foil: false },
      { code: 'FWC19', label: 'Selección campeona 11',    foil: false },
    ],
  },
  {
    id: 'cocacola',
    type: 'special',
    name: 'Coca-Cola',
    stickers: Array.from({ length: 14 }, (_, i) => ({
      code: `CC${i + 1}`,
      label: `Coca-Cola ${i + 1}`,
      foil: false,
    })),
  },
];

const ALBUM = {
  id: 'wc2026',
  name: 'FIFA World Cup 2026 Official Sticker Collection',
  edition: 'standard',
  publisher: 'Panini',
};

// ============================================================
// 2. GENERACIÓN — normalmente no necesitas tocar nada de aquí
// ============================================================

function labelForSlot(slotNumber) {
  if (slotNumber === TEAM_LAYOUT.emblemSlot) return { label: 'Escudo', kind: 'emblem' };
  if (slotNumber === TEAM_LAYOUT.teamPhotoSlot) return { label: 'Foto del equipo', kind: 'teamPhoto' };
  return { label: null, kind: 'player' }; // label de jugador se pone luego
}

function build() {
  const sections = [];
  const stickers = [];
  let order = 0;

  // --- Secciones de equipos ---
  TEAMS.forEach((team, teamIndex) => {
    sections.push({
      id: team.id,
      type: 'team',
      name: team.name,
      code: team.code,
      group: team.group,
      slotCount: TEAM_LAYOUT.slotsPerTeam,
      order: teamIndex + 1,
    });

    let playerCounter = 0;
    for (let n = 1; n <= TEAM_LAYOUT.slotsPerTeam; n++) {
      const { label, kind } = labelForSlot(n);
      if (kind === 'player') playerCounter++;
      stickers.push({
        code: `${team.code}${n}`,        // ID del documento en Firestore
        number: n,                        // número dentro de la selección
        sectionId: team.id,
        sectionName: team.name,
        kind,                             // emblem | teamPhoto | player
        label: label || `Jugador ${playerCounter}`,
        special: false,
        foil: kind === 'emblem',          // los escudos suelen ser foil
        order: order++,
      });
    }
  });

  // --- Secciones especiales ---
  SPECIAL_SECTIONS.forEach((sec, idx) => {
    sections.push({
      id: sec.id,
      type: sec.type,
      name: sec.name,
      slotCount: sec.stickers.length,
      order: TEAMS.length + idx + 1,
    });
    sec.stickers.forEach((sp, n) => {
      stickers.push({
        code: sp.code,
        number: n + 1,
        sectionId: sec.id,
        sectionName: sec.name,
        kind: 'special',
        label: sp.label,
        special: true,
        foil: !!sp.foil,
        order: order++,
      });
    });
  });

  return {
    album: { ...ALBUM, totalSlots: stickers.length, teamCount: TEAMS.length },
    sections,
    stickers,
  };
}

const catalog = build();
const outPath = path.join(__dirname, 'catalog.json');
fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2));

console.log('Catálogo generado:');
console.log(`  Selecciones:      ${catalog.album.teamCount}`);
console.log(`  Slots por equipo: ${TEAM_LAYOUT.slotsPerTeam}`);
console.log(`  Cromos de equipos: ${catalog.album.teamCount * TEAM_LAYOUT.slotsPerTeam}`);
console.log(`  Cromos especiales: ${catalog.stickers.filter(s => s.special).length}`);
console.log(`  TOTAL slots:       ${catalog.album.totalSlots}`);
console.log(`  Archivo:           ${outPath}`);
