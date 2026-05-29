export interface ProjectLocation {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  minThreshold: number; // Low stock trigger
  warningBuffer: number; // e.g., 5. Current stock <= minThreshold + warningBuffer triggers warning state
  lastUpdated: string;
  locationId?: string; // Links material to a project location
}

export interface LogEntry {
  id: string;
  type: 'incoming' | 'usage'; // incoming (+) or usage (-)
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  operator: string;
  timestamp: string;
  notes?: string;
  locationId?: string; // Links transaction to a project location
}

export type TabType = 'dashboard' | 'quick-action' | 'history';
export type FilterType = 'all' | 'safe' | 'warning' | 'critical';
