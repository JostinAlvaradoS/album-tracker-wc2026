/**
 * Generador del catálogo del álbum del Mundial 2026.
 * Produce catalog.json listo para import-to-firestore.js.
 *
 * Solo necesitas correrlo si modificas la estructura del álbum
 * (otros nombres, otra cantidad de slots, otro álbum). El catalog.json
 * resultante ya está versionado en el repo.
 *
 * Uso:  node generate-catalog.js
 */

const fs = require('fs');
const path = require('path');

const TEAM_LAYOUT = {
  slotsPerTeam: 20,    // 20 cromos por selección (1 escudo + 1 foto + 18 jugadores)
  emblemSlot: 1,       // MEX1 = escudo (foil)
  teamPhotoSlot: 13,   // MEX13 = foto del equipo (horizontal)
};

// 48 selecciones en el orden EXACTO de la planilla de control
const TEAMS = [
  { id: 'mex', code: 'MEX', name: 'México' },
  { id: 'rsa', code: 'RSA', name: 'Sudáfrica' },
  { id: 'kor', code: 'KOR', name: 'Corea del Sur' },
  { id: 'cze', code: 'CZE', name: 'Chequia' },
  { id: 'can', code: 'CAN', name: 'Canadá' },
  { id: 'bih', code: 'BIH', name: 'Bosnia y Herzegovina' },
  { id: 'qat', code: 'QAT', name: 'Catar' },
  { id: 'sui', code: 'SUI', name: 'Suiza' },
  { id: 'bra', code: 'BRA', name: 'Brasil' },
  { id: 'mar', code: 'MAR', name: 'Marruecos' },
  { id: 'hai', code: 'HAI', name: 'Haití' },
  { id: 'sco', code: 'SCO', name: 'Escocia' },
  { id: 'usa', code: 'USA', name: 'Estados Unidos' },
  { id: 'par', code: 'PAR', name: 'Paraguay' },
  { id: 'aus', code: 'AUS', name: 'Australia' },
  { id: 'tur', code: 'TUR', name: 'Turquía' },
  { id: 'ger', code: 'GER', name: 'Alemania' },
  { id: 'cuw', code: 'CUW', name: 'Curazao' },
  { id: 'civ', code: 'CIV', name: 'Costa de Marfil' },
  { id: 'ecu', code: 'ECU', name: 'Ecuador' },
  { id: 'ned', code: 'NED', name: 'Países Bajos' },
  { id: 'jpn', code: 'JPN', name: 'Japón' },
  { id: 'swe', code: 'SWE', name: 'Suecia' },
  { id: 'tun', code: 'TUN', name: 'Túnez' },
  { id: 'bel', code: 'BEL', name: 'Bélgica' },
  { id: 'egy', code: 'EGY', name: 'Egipto' },
  { id: 'irn', code: 'IRN', name: 'Irán' },
  { id: 'nzl', code: 'NZL', name: 'Nueva Zelanda' },
  { id: 'esp', code: 'ESP', name: 'España' },
  { id: 'cpv', code: 'CPV', name: 'Cabo Verde' },
  { id: 'ksa', code: 'KSA', name: 'Arabia Saudí' },
  { id: 'uru', code: 'URU', name: 'Uruguay' },
  { id: 'fra', code: 'FRA', name: 'Francia' },
  { id: 'sen', code: 'SEN', name: 'Senegal' },
  { id: 'irq', code: 'IRQ', name: 'Irak' },
  { id: 'nor', code: 'NOR', name: 'Noruega' },
  { id: 'arg', code: 'ARG', name: 'Argentina' },
  { id: 'alg', code: 'ALG', name: 'Argelia' },
  { id: 'aut', code: 'AUT', name: 'Austria' },
  { id: 'jor', code: 'JOR', name: 'Jordania' },
  { id: 'por', code: 'POR', name: 'Portugal' },
  { id: 'cod', code: 'COD', name: 'R. D. del Congo' },
  { id: 'uzb', code: 'UZB', name: 'Uzbekistán' },
  { id: 'col', code: 'COL', name: 'Colombia' },
  { id: 'eng', code: 'ENG', name: 'Inglaterra' },
  { id: 'cro', code: 'CRO', name: 'Croacia' },
  { id: 'gha', code: 'GHA', name: 'Ghana' },
  { id: 'pan', code: 'PAN', name: 'Panamá' },
];

// Secciones especiales en el orden de la planilla:
//   1) FWC1-8 al INICIO (placement: 'before')
//   2) 48 equipos
//   3) FWC9-19 al FINAL (placement: 'after')
//   4) Coca-Cola CC1-14 (placement: 'after')
const SPECIAL_SECTIONS = [
  {
    id: 'fwc_intro',
    type: 'special',
    name: 'FIFA World Cup 2026',
    placement: 'before',
    stickers: [
      { code: '00',   label: 'Logo Panini',             foil: false, kind: 'special' },
      { code: 'FWC1', label: 'Official Emblem',         foil: true,  kind: 'special' },
      { code: 'FWC2', label: 'Official Emblem',         foil: true,  kind: 'special' },
      { code: 'FWC3', label: 'Official Mascots',        foil: false, kind: 'special' },
      { code: 'FWC4', label: 'Official Slogan',         foil: false, kind: 'special' },
      { code: 'FWC5', label: 'Official Ball',           foil: false, kind: 'special' },
      { code: 'FWC6', label: 'Trophy',                  foil: true,  kind: 'special' },
      { code: 'FWC7', label: 'Host Country Emblem',     foil: false, kind: 'special' },
      { code: 'FWC8', label: 'Host Country Emblem',     foil: false, kind: 'special' },
    ],
  },
  {
    id: 'fwc_champions',
    type: 'special',
    name: 'Selecciones campeonas',
    placement: 'after',
    stickers: [
      { code: 'FWC9',  label: 'Campeón 1',  foil: false, kind: 'emblem' },
      { code: 'FWC10', label: 'Campeón 2',  foil: false, kind: 'emblem' },
      { code: 'FWC11', label: 'Campeón 3',  foil: false, kind: 'emblem' },
      { code: 'FWC12', label: 'Campeón 4',  foil: false, kind: 'emblem' },
      { code: 'FWC13', label: 'Campeón 5',  foil: false, kind: 'emblem' },
      { code: 'FWC14', label: 'Campeón 6',  foil: false, kind: 'emblem' },
      { code: 'FWC15', label: 'Campeón 7',  foil: false, kind: 'emblem' },
      { code: 'FWC16', label: 'Campeón 8',  foil: false, kind: 'emblem' },
      { code: 'FWC17', label: 'Campeón 9',  foil: false, kind: 'emblem' },
      { code: 'FWC18', label: 'Campeón 10', foil: false, kind: 'emblem' },
      { code: 'FWC19', label: 'Campeón 11', foil: false, kind: 'emblem' },
    ],
  },
  {
    id: 'cocacola',
    type: 'special',
    name: 'Coca-Cola',
    placement: 'after',
    stickers: Array.from({ length: 14 }, (_, i) => ({
      code: `CC${i + 1}`,
      label: `Coca-Cola ${i + 1}`,
      foil: false,
      kind: 'special',
    })),
  },
];

const ALBUM = {
  id: 'wc2026',
  name: 'FIFA World Cup 2026 Official Sticker Collection',
  edition: 'standard',
  publisher: 'Panini',
};

function labelForSlot(n) {
  if (n === TEAM_LAYOUT.emblemSlot)    return { label: 'Escudo',          kind: 'emblem' };
  if (n === TEAM_LAYOUT.teamPhotoSlot) return { label: 'Foto del equipo', kind: 'teamPhoto' };
  return { label: null, kind: 'player' };
}

function build() {
  const sections = [];
  const stickers = [];
  let order = 0;

  const before = SPECIAL_SECTIONS.filter((s) => s.placement === 'before');
  const after  = SPECIAL_SECTIONS.filter((s) => s.placement === 'after');

  const pushSpecial = (sec, baseOrder) => {
    sections.push({
      id: sec.id,
      type: sec.type,
      name: sec.name,
      slotCount: sec.stickers.length,
      order: baseOrder,
    });
    sec.stickers.forEach((sp, n) => {
      stickers.push({
        code: sp.code,
        number: n + 1,
        sectionId: sec.id,
        sectionName: sec.name,
        kind: sp.kind,
        label: sp.label,
        special: true,
        foil: !!sp.foil,
        order: order++,
      });
    });
  };

  // 1) Especiales antes de las selecciones
  before.forEach((sec, i) => pushSpecial(sec, i + 1));

  // 2) 48 selecciones
  TEAMS.forEach((team, teamIndex) => {
    sections.push({
      id: team.id,
      type: 'team',
      name: team.name,
      code: team.code,
      slotCount: TEAM_LAYOUT.slotsPerTeam,
      order: before.length + teamIndex + 1,
    });

    let playerCounter = 0;
    for (let n = 1; n <= TEAM_LAYOUT.slotsPerTeam; n++) {
      const { label, kind } = labelForSlot(n);
      if (kind === 'player') playerCounter++;
      stickers.push({
        code: `${team.code}${n}`,
        number: n,
        sectionId: team.id,
        sectionName: team.name,
        kind,
        label: label || `Jugador ${playerCounter}`,
        special: false,
        foil: kind === 'emblem',
        order: order++,
      });
    }
  });

  // 3) Especiales después de las selecciones
  after.forEach((sec, i) =>
    pushSpecial(sec, before.length + TEAMS.length + i + 1)
  );

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
console.log(`  Selecciones:        ${catalog.album.teamCount}`);
console.log(`  Slots por equipo:   ${TEAM_LAYOUT.slotsPerTeam}`);
console.log(`  Cromos de equipos:  ${catalog.album.teamCount * TEAM_LAYOUT.slotsPerTeam}`);
console.log(`  Cromos especiales:  ${catalog.stickers.filter((s) => s.special).length}`);
console.log(`  TOTAL slots:        ${catalog.album.totalSlots}`);
console.log(`  Archivo:            ${outPath}`);
