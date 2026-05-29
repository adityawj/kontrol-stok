import { Material, LogEntry } from './types';

export const INITIAL_MATERIALS: Material[] = [
  {
    id: 'mat-1',
    name: 'Semen Padang PCC',
    category: 'Semen',
    currentStock: 8,
    unit: 'Sak',
    minThreshold: 15,
    warningBuffer: 10, // Stock <= 25 (15+10) is Warning, <= 15 is Critical
    lastUpdated: '2026-05-28T05:22:00Z',
  },
  {
    id: 'mat-2',
    name: 'Besi Beton Ø 10mm',
    category: 'Logam',
    currentStock: 32,
    unit: 'Batang',
    minThreshold: 30,
    warningBuffer: 15, // Stock <= 45 is Warning, <= 30 is Critical
    lastUpdated: '2026-05-28T04:15:00Z',
  },
  {
    id: 'mat-3',
    name: 'Pasir Beton Kediri',
    category: 'Agregat',
    currentStock: 18,
    unit: 'm³',
    minThreshold: 5,
    warningBuffer: 5, // Stock <= 10 is Warning, <= 5 is Critical
    lastUpdated: '2026-05-28T03:10:00Z',
  },
  {
    id: 'mat-4',
    name: 'Batu Bata Merah Oven',
    category: 'Struktur',
    currentStock: 3500,
    unit: 'Pcs',
    minThreshold: 1000,
    warningBuffer: 1000, // Stock <= 2000 is Warning, <= 1000 is Critical
    lastUpdated: '2026-05-27T16:30:00Z',
  },
  {
    id: 'mat-5',
    name: 'Cat Tembok Nippon Paint Weatherbond (Putih)',
    category: 'Finishing',
    currentStock: 2,
    unit: 'Pail',
    minThreshold: 4,
    warningBuffer: 2, // Stock <= 6 is Warning, <= 4 is Critical
    lastUpdated: '2026-05-28T02:00:00Z',
  },
  {
    id: 'mat-6',
    name: 'Keramik Milan 40x40 Putih',
    category: 'Finishing',
    currentStock: 60,
    unit: 'Dus',
    minThreshold: 15,
    warningBuffer: 10, // Stock <= 25 is Warning
    lastUpdated: '2026-05-26T11:45:00Z',
  },
  {
    id: 'mat-7',
    name: 'Pipa PVC Wavin AW 3"',
    category: 'Plumbing',
    currentStock: 12,
    unit: 'Batang',
    minThreshold: 10,
    warningBuffer: 5,
    lastUpdated: '2026-05-28T01:30:00Z',
  }
];

export const INITIAL_LOG_ENTRIES: LogEntry[] = [
  {
    id: 'log-1',
    type: 'incoming',
    materialId: 'mat-1',
    materialName: 'Semen Padang PCC',
    quantity: 50,
    unit: 'Sak',
    operator: 'Supriyadi (Mandor 1)',
    timestamp: '2026-05-27T08:30:00Z',
    notes: 'Kirim dari Gudang Utama CV. Maju Bersama',
  },
  {
    id: 'log-2',
    type: 'usage',
    materialId: 'mat-1',
    materialName: 'Semen Padang PCC',
    quantity: 15,
    unit: 'Sak',
    operator: 'Budi (Mandor)',
    timestamp: '2026-05-27T10:15:00Z',
    notes: 'Plester dinding pembatas area Barat',
  },
  {
    id: 'log-3',
    type: 'incoming',
    materialId: 'mat-3',
    materialName: 'Pasir Beton Kediri',
    quantity: 6,
    unit: 'm³',
    operator: 'Heri (Logistik)',
    timestamp: '2026-05-27T14:40:00Z',
    notes: 'Truk Tronton nopol AG 9081 UK',
  },
  {
    id: 'log-4',
    type: 'usage',
    materialId: 'mat-2',
    materialName: 'Besi Beton Ø 10mm',
    quantity: 8,
    unit: 'Batang',
    operator: 'Slamet (Fabrikasi)',
    timestamp: '2026-05-28T02:15:00Z',
    notes: 'Pembuatan sengkang & begel tiang kolom',
  },
  {
    id: 'log-5',
    type: 'usage',
    materialId: 'mat-5',
    materialName: 'Cat Tembok Nippon Paint Weatherbond (Putih)',
    quantity: 3,
    unit: 'Pail',
    operator: 'Sutrisno (Finishing)',
    timestamp: '2026-05-28T05:00:00Z',
    notes: 'Pengecatan fasad luar lantai 2',
  },
  {
    id: 'log-6',
    type: 'usage',
    materialId: 'mat-1',
    materialName: 'Semen Padang PCC',
    quantity: 27,
    unit: 'Sak',
    operator: 'Budi (Mandor)',
    timestamp: '2026-05-28T05:22:00Z',
    notes: 'Pengecoran dak lantai dasar masjid',
  }
];

export const MATERIAL_CATEGORIES = [
  'Semen',
  'Logam',
  'Agregat',
  'Struktur',
  'Finishing',
  'Plumbing',
  'Kelistrikan',
  'Lain-lain',
];

export const INITIAL_LOCATIONS = [
  {
    id: 'loc-1',
    name: 'Pabrik Utama',
    description: 'Pembangunan struktur pabrik utama & dak beton',
    createdAt: '2026-05-28T00:00:00Z',
  },
  {
    id: 'loc-2',
    name: 'Gedung Kantor',
    description: 'Pekerjaan administratif & finishing kantor samping',
    createdAt: '2526-05-28T00:00:00Z',
  },
  {
    id: 'loc-3',
    name: 'Pos Pengawas',
    description: 'Pembangunan pos keamanan depan & pagar keliling',
    createdAt: '2026-05-28T00:00:00Z',
  }
];
