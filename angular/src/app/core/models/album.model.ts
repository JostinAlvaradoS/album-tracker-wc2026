// ----- Catálogo (compartido, solo lectura para usuarios) -----

export type SectionType = 'team' | 'special' | 'intro' | 'legends';
export type StickerKind = 'emblem' | 'teamPhoto' | 'player' | 'special';

export interface Album {
  id: string;
  name: string;
  edition: string;
  publisher: string;
  totalSlots: number;
  teamCount: number;
}

export interface Section {
  id: string;
  type: SectionType;
  name: string;
  code?: string;       // p.ej. "MEX" para selecciones
  group?: string;
  slotCount: number;
  order: number;
}

export interface Sticker {
  code: string;        // ID del documento: "MEX1", "ARG13"...
  number: number;      // número dentro de la sección
  sectionId: string;
  sectionName: string;
  kind: StickerKind;
  label: string;       // "Escudo", "Jugador 5", "Foto del equipo"
  special: boolean;
  foil: boolean;
  order: number;
}

// ----- Inventario del usuario -----

export interface CollectionItem {
  stickerId: string;   // mismo valor que Sticker.code
  count: number;       // 1 = pegado, >=2 = tiene repes
  updatedAt?: unknown; // Timestamp de Firestore
}

export interface UserCollection {
  albumId: string;
  startedAt?: unknown;
  stats: CollectionStats;
}

export interface CollectionStats {
  owned: number;       // cromos distintos que tiene
  missing: number;     // cromos que faltan
  duplicates: number;  // total de repes (suma de count-1)
  total: number;
}

// ----- Vista combinada (catálogo + inventario) -----

export type StickerStatus = 'missing' | 'owned' | 'duplicate';

export interface StickerView extends Sticker {
  count: number;
  status: StickerStatus;
}

export interface SectionView extends Section {
  stickers: StickerView[];
  ownedCount: number;
}

// ----- Estadísticas derivadas (para la pantalla de progreso) -----

/** Progreso de una sección concreta (una selección o sección especial). */
export interface SectionProgress {
  id: string;
  name: string;
  type: SectionType;
  owned: number;
  total: number;
  duplicates: number;
  /** 0–100 */
  percent: number;
  complete: boolean;
}

/** Resumen global de la colección. */
export interface AlbumProgress {
  owned: number;
  missing: number;
  total: number;
  /** 0–100 */
  percent: number;
  /** Total de cromos repetidos (suma de count-1). */
  duplicates: number;
  /** Cromos físicos pegados + repes = lo que el usuario tiene en mano. */
  totalStickersOwned: number;
  /** Secciones (selecciones) ya completadas. */
  sectionsComplete: number;
  sectionsTotal: number;
  /** Desglose por sección, ordenado. */
  sections: SectionProgress[];
}
