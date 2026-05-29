import React, { useState, useEffect, useRef } from 'react';
import { Material, LogEntry, TabType, ProjectLocation } from './types';
import { INITIAL_MATERIALS, INITIAL_LOG_ENTRIES, INITIAL_LOCATIONS } from './data';
import Dashboard from './components/Dashboard';
import QuickAction from './components/QuickAction';
import ActivityLog from './components/ActivityLog';
import { 
  Building2, 
  Layers, 
  History, 
  Zap, 
  HardHat, 
  Calendar,
  AlertOctagon,
  RefreshCw,
  Clock,
  MapPin,
  Plus,
  Trash,
  Edit2,
  X,
  ChevronRight,
  ChevronDown,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Multi-location project state
  const [locations, setLocations] = useState<ProjectLocation[]>([]);
  const [activeLocationId, setActiveLocationId] = useState<string>('loc-1');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // New location form states
  const [newLocName, setNewLocName] = useState('');
  const [newLocDesc, setNewLocDesc] = useState('');
  const [editingLocId, setEditingLocId] = useState<string | null>(null);
  const [editingLocName, setEditingLocName] = useState('');
  const [editingLocDesc, setEditingLocDesc] = useState('');
  const [locationFormError, setLocationFormError] = useState('');

  // States to pass selected material and action type from direct dashboard shortcuts to QuickAction form
  const [selectedQuickActionMaterial, setSelectedQuickActionMaterial] = useState<string>('');
  const [selectedQuickActionType, setSelectedQuickActionType] = useState<'incoming' | 'usage'>('usage');

  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);

  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(135);

  // Measure header height dynamically to ensure perfect spacer height
  useEffect(() => {
    if (headerRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setHeaderHeight(entry.target.clientHeight);
        }
      });
      observer.observe(headerRef.current);
      return () => observer.disconnect();
    }
  }, []);

  // Reset header visibility when tab changes and scroll to top
  useEffect(() => {
    setShowHeader(true);
    const scrollContainer = document.getElementById('main-content-scrollable');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }, [activeTab]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    
    if (currentScrollY <= 15) {
      setShowHeader(true);
    } else if (currentScrollY > lastScrollY.current && currentScrollY > 40) {
      setShowHeader(false);
    } else if (currentScrollY < lastScrollY.current) {
      setShowHeader(true);
    }
    lastScrollY.current = currentScrollY;
  };

  // Load initial data from localStorage or fallback
  useEffect(() => {
    const savedLocations = localStorage.getItem('lapangan_locations');
    const savedMaterials = localStorage.getItem('lapangan_materials');
    const savedLogs = localStorage.getItem('lapangan_logs');
    const savedActiveLoc = localStorage.getItem('lapangan_active_location_id');

    let loadedLocations: ProjectLocation[] = [];
    if (savedLocations) {
      try {
        const parsed = JSON.parse(savedLocations);
        setLocations(parsed);
        loadedLocations = parsed;
      } catch (e) {
        setLocations(INITIAL_LOCATIONS);
        loadedLocations = INITIAL_LOCATIONS;
      }
    } else {
      setLocations(INITIAL_LOCATIONS);
      loadedLocations = INITIAL_LOCATIONS;
      localStorage.setItem('lapangan_locations', JSON.stringify(INITIAL_LOCATIONS));
    }

    if (savedActiveLoc) {
      setActiveLocationId(savedActiveLoc);
    } else {
      setActiveLocationId('loc-1');
      localStorage.setItem('lapangan_active_location_id', 'loc-1');
    }

    if (savedMaterials) {
      try {
        const parsedMats = JSON.parse(savedMaterials);
        const normalizedMats = parsedMats.map((m: any) => ({
          ...m,
          locationId: m.locationId || 'loc-1'
        }));
        setMaterials(normalizedMats);
      } catch (e) {
        setMaterials([]);
      }
    } else {
      // Map initial materials to loc-1
      const defaultMats = INITIAL_MATERIALS.map(m => ({
        ...m,
        locationId: 'loc-1'
      }));
      setMaterials(defaultMats);
      localStorage.setItem('lapangan_materials', JSON.stringify(defaultMats));
    }

    if (savedLogs) {
      try {
        const parsedLogs = JSON.parse(savedLogs);
        const normalizedLogs = parsedLogs.map((l: any) => ({
          ...l,
          locationId: l.locationId || 'loc-1'
        }));
        setLogs(normalizedLogs);
      } catch (e) {
        setLogs([]);
      }
    } else {
      // Map initial logs to loc-1
      const defaultLogs = INITIAL_LOG_ENTRIES.map(l => ({
        ...l,
        locationId: 'loc-1'
      }));
      setLogs(defaultLogs);
      localStorage.setItem('lapangan_logs', JSON.stringify(defaultLogs));
    }
  }, []);

  // Sync back state changes to localStorage
  const saveMaterialsToStorage = (updatedMaterials: Material[]) => {
    setMaterials(updatedMaterials);
    localStorage.setItem('lapangan_materials', JSON.stringify(updatedMaterials));
  };

  const saveLogsToStorage = (updatedLogs: LogEntry[]) => {
    setLogs(updatedLogs);
    localStorage.setItem('lapangan_logs', JSON.stringify(updatedLogs));
  };

  const saveLocationsToStorage = (updatedLocs: ProjectLocation[]) => {
    setLocations(updatedLocs);
    localStorage.setItem('lapangan_locations', JSON.stringify(updatedLocs));
  };

  // Switch location active state
  const handleSelectLocation = (id: string) => {
    setActiveLocationId(id);
    localStorage.setItem('lapangan_active_location_id', id);
    setIsLocationModalOpen(false);
    setLocationFormError('');
  };

  // Add location with pre-filled default materials at 0 stock
  const handleAddLocation = (name: string, description: string) => {
    if (!name.trim()) {
      setLocationFormError('Nama lokasi tidak boleh kosong');
      return;
    }
    const newId = `loc-${Date.now()}`;
    const newLocation: ProjectLocation = {
      id: newId,
      name: name.trim(),
      description: description.trim() || undefined,
      createdAt: new Date().toISOString()
    };
    const updatedLocs = [...locations, newLocation];
    saveLocationsToStorage(updatedLocs);

    // Seed standard base materials with 0 stock so user has predefined categories
    const prefilledMaterials = INITIAL_MATERIALS.map((item, idx) => ({
      ...item,
      id: `mat-${newId}-${idx}`,
      currentStock: 0,
      locationId: newId,
      lastUpdated: new Date().toISOString()
    }));

    const updatedMaterials = [...materials, ...prefilledMaterials];
    saveMaterialsToStorage(updatedMaterials);

    // Switch to new location
    setActiveLocationId(newId);
    localStorage.setItem('lapangan_active_location_id', newId);
    
    // Clear form
    setNewLocName('');
    setNewLocDesc('');
    setLocationFormError('');
  };

  // Rename / edit location details
  const handleRenameLocation = (id: string, name: string, description: string) => {
    if (!name.trim()) {
      setLocationFormError('Nama lokasi tidak boleh kosong');
      return;
    }
    const updated = locations.map(l => l.id === id ? { 
      ...l, 
      name: name.trim(), 
      description: description.trim() || undefined 
    } : l);
    saveLocationsToStorage(updated);
    setEditingLocId(null);
    setEditingLocName('');
    setEditingLocDesc('');
    setLocationFormError('');
  };

  // Delete project location completely along with its materials/logs
  const handleDeleteLocation = (id: string) => {
    if (locations.length <= 1) {
      setLocationFormError('Gagal: Minimal harus ada satu lokasi proyek dalam sistem!');
      return;
    }
    
    const updatedLocs = locations.filter(l => l.id !== id);
    const updatedMaterials = materials.filter(m => (m.locationId || 'loc-1') !== id);
    const updatedLogs = logs.filter(l => (l.locationId || 'loc-1') !== id);

    saveLocationsToStorage(updatedLocs);
    saveMaterialsToStorage(updatedMaterials);
    saveLogsToStorage(updatedLogs);

    if (activeLocationId === id) {
      const fallbackId = updatedLocs[0].id;
      setActiveLocationId(fallbackId);
      localStorage.setItem('lapangan_active_location_id', fallbackId);
    }

    setLocationFormError('');
    setEditingLocId(null);
  };

  // 1. Add material to catalog
  const handleAddMaterial = (newMat: Omit<Material, 'id' | 'lastUpdated'>) => {
    const freshMaterial: Material = {
      ...newMat,
      id: `mat-${Date.now()}`,
      lastUpdated: new Date().toISOString(),
      locationId: activeLocationId // Save inside active location
    };
    const updated = [...materials, freshMaterial];
    saveMaterialsToStorage(updated);
  };

  // 2. Edit material threshold settings
  const handleEditMaterial = (editedMat: Material) => {
    const updated = materials.map(m => m.id === editedMat.id ? {
      ...editedMat,
      locationId: editedMat.locationId || activeLocationId // keep or assign active location link
    } : m);
    saveMaterialsToStorage(updated);
  };

  // 3. Delete material item from list
  const handleDeleteMaterial = (id: string) => {
    const updated = materials.filter(m => m.id !== id);
    saveMaterialsToStorage(updated);
  };

  // 4. Log direct material transaction (Incoming (+) or Usage (-))
  const handleLogTransaction = (
    type: 'incoming' | 'usage',
    materialId: string,
    quantity: number,
    operator: string,
    notes: string,
    customTime?: string
  ) => {
    const targetMaterial = materials.find(m => m.id === materialId);
    if (!targetMaterial) return;

    // Calculate update
    let updatedStock = targetMaterial.currentStock;
    if (type === 'incoming') {
      updatedStock += quantity;
    } else {
      updatedStock = Math.max(0, updatedStock - quantity); // prevent negative stock
    }

    // Update material stock level
    const updatedMaterials = materials.map(m => {
      if (m.id === materialId) {
        return {
          ...m,
          currentStock: updatedStock,
          lastUpdated: customTime || new Date().toISOString()
        };
      }
      return m;
    });
    saveMaterialsToStorage(updatedMaterials);

    // Create log entry item with locationId link
    const newLog: LogEntry = {
      id: `log-${Date.now()}`,
      type,
      materialId,
      materialName: targetMaterial.name,
      quantity,
      unit: targetMaterial.unit,
      operator,
      notes,
      timestamp: customTime || new Date().toISOString(),
      locationId: targetMaterial.locationId || activeLocationId // Link transaction to the material's location
    };

    const updatedLogs = [newLog, ...logs];
    saveLogsToStorage(updatedLogs);
  };

  // 5. Hard Reset logs
  const handleClearLogs = () => {
    saveLogsToStorage([]);
  };

  // Derive active location data
  const activeLocation = locations.find(l => l.id === activeLocationId) || locations[0] || INITIAL_LOCATIONS[0];
  
  // Filter materials for currently active location
  const activeLocationMaterials = materials.filter(m => (m.locationId || 'loc-1') === activeLocationId);
  
  // Filter logs for currently active location
  const activeLocationLogs = logs.filter(l => (l.locationId || 'loc-1') === activeLocationId);

  // Count critical low stock items specifically for the active location for badge notification
  const criticalCount = activeLocationMaterials.filter(m => m.currentStock <= m.minThreshold).length;

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden md:h-auto md:max-h-none md:overflow-visible md:min-h-screen bg-slate-900 md:bg-stone-900/40 font-sans text-slate-800 antialiased flex flex-col justify-start md:py-8 md:px-4" id="app-root">
      
      {/* Smartphone View Container Mockup to ensure beautiful layout and focus */}
      <div className="w-full max-w-md mx-auto bg-slate-50 h-full md:h-[850px] md:max-h-[92vh] flex flex-col justify-between md:rounded-[36px] md:shadow-2xl overflow-hidden border border-slate-200/50 md:border-slate-800 relative" id="mobile-shell">
        
        {/* Top Status Area / Phone Notch Filler */}
        <div className="bg-blue-900 text-blue-100/60 px-6 py-1 text-[11px] font-mono tracking-widest flex justify-between select-none shrink-0 z-30">
          <div className="flex items-center gap-1.5 text-blue-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>KONTROL STOK LAPANGAN v1.5</span>
          </div>
          <div className="text-right">{new Date().toISOString().slice(0, 10)}</div>
        </div>

        {/* Dynamic Construction Header - Absolutely positioned inside the relative shell to prevent layout shift of scroll element */}
        <motion.header 
          ref={headerRef}
          animate={{ 
            y: showHeader ? 0 : -(headerHeight + 30),
            opacity: showHeader ? 1 : 0
          }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="absolute left-0 right-0 top-[23px] bg-blue-800 text-white px-5 py-4 pb-3.5 border-b border-blue-900 shadow-md z-20 overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-2xl shadow-inner text-white flex items-center justify-center border border-blue-500">
                <Building2 className="w-6 h-6 stroke-[2]" />
              </div>
              
              {/* Interactive Location Picker Button */}
              <button 
                onClick={() => {
                  setLocationFormError('');
                  setIsLocationModalOpen(true);
                }}
                className="text-left group focus:outline-none py-0.5 px-1.5 -ml-1.5 rounded-xl hover:bg-blue-700/50 transition-all duration-150 border border-transparent hover:border-blue-500/20"
                title="Ganti Lokasi Proyek"
                id="location-picker-trigger"
              >
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-extrabold tracking-widest text-blue-300 block uppercase">Titik Lokasi Aktif</span>
                  <ChevronDown className="w-2.5 h-2.5 text-blue-350 transition-transform group-hover:translate-y-0.5 text-blue-300" />
                </div>
                <h1 className="text-[14px] font-extrabold tracking-tight text-white line-clamp-1 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-bounce" />
                  <span>{activeLocation?.name || 'Pilih Lokasi...'}</span>
                </h1>
              </button>
            </div>

            {/* Quick Location Settings Icon Button */}
            <button 
              onClick={() => {
                setLocationFormError('');
                setIsLocationModalOpen(true);
              }}
              className="p-2 bg-blue-700/60 hover:bg-blue-705 border border-blue-600 hover:bg-blue-600 text-blue-100 hover:text-white rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1.5 text-xs font-bold"
              title="Kelola Semua Lokasi"
              id="manage-locations-btn"
            >
              <Building className="w-3.5 h-3.5" />
              <span>Lokasi ({locations.length})</span>
            </button>
          </div>

          {/* Quick weather / status metadata banner under construction header */}
          <div className="mt-3.5 bg-blue-900/60 border border-blue-700/50 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-blue-100 font-medium">
            <div className="flex items-center gap-1.5 text-red-200" id="low-stock-alert-pill">
              <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
              <span>STOK KRITIS: <strong className="font-mono text-xs text-white">{criticalCount} ITEM</strong></span>
            </div>
            <div className="flex items-center gap-1 text-blue-200">
              <Calendar className="w-3.5 h-3.5 text-blue-300" />
              <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </motion.header>

        {/* Main Content Area (Scrollable with nice padding) */}
        <main 
          className="flex-1 overflow-y-auto px-4 py-5 space-y-4 no-scrollbar bg-slate-50 relative" 
          id="main-content-scrollable"
          onScroll={handleScroll}
        >
          {/* Scroll Content Spacer corresponding perfectly to absolute header bar height plus additional safe offset */}
          <div style={{ height: headerHeight + 8 }} className="w-full shrink-0" id="absolute-header-spacer" />

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {/* Information badge about filtered perspective */}
                <div className="mb-3 bg-white border border-slate-205/60 border-slate-200 rounded-xl p-2.5 px-3 flex items-center justify-between text-[11px] text-slate-500 shadow-2xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span>Menampilkan material untuk: <strong className="text-slate-800 underline font-extrabold">{activeLocation?.name}</strong></span>
                  </div>
                  <button 
                    onClick={() => setIsLocationModalOpen(true)}
                    className="text-blue-600 font-extrabold hover:underline"
                  >
                    Ganti
                  </button>
                </div>

                <Dashboard 
                  materials={activeLocationMaterials}
                  onAddMaterial={handleAddMaterial}
                  onEditMaterial={handleEditMaterial}
                  onDeleteMaterial={handleDeleteMaterial}
                  setActiveTab={setActiveTab}
                  setSelectedQuickActionMaterial={setSelectedQuickActionMaterial}
                  setSelectedQuickActionType={setSelectedQuickActionType}
                />
              </motion.div>
            )}

            {activeTab === 'quick-action' && (
              <motion.div
                key="quick-action"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {/* Quick location tag for operations */}
                <div className="mb-3 bg-amber-50/70 border border-amber-100/80 rounded-xl p-2.5 px-3 flex items-center gap-2 text-[11px] text-amber-900 shadow-2xs">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Transaksi akan dicatat pada lokasi proyek: <strong className="font-extrabold text-blue-900">{activeLocation?.name}</strong></span>
                </div>

                <QuickAction 
                  materials={activeLocationMaterials}
                  onLogTransaction={handleLogTransaction}
                  selectedMaterialId={selectedQuickActionMaterial}
                  selectedType={selectedQuickActionType}
                  clearSelectedMaterialId={() => setSelectedQuickActionMaterial('')}
                  setActiveTab={setActiveTab}
                />
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <ActivityLog 
                  logs={logs}
                  materials={materials}
                  onClearLogs={handleClearLogs}
                  locations={locations}
                  activeLocationId={activeLocationId}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* BOTTOM NAV BAR SHAPE AS PRIMARY FOOTER FOR Foremen (Fat Finger Friendly) */}
        <nav className="bg-white border-t border-slate-200/80 px-4 py-3 shrink-0 flex items-center justify-around z-10 shadow-lg relative" id="bottom-bar-navigation">
          
          {/* Item 1: Dashboard page */}
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setSelectedQuickActionMaterial('');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl relative transition-all ${
              activeTab === 'dashboard'
                ? 'text-blue-700 scale-102 font-bold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            id="nav-btn-dashboard"
          >
            <Layers className="w-5.5 h-5.5" />
            <span className="text-[10px] tracking-tight mt-1.5 font-bold">Stok & Alert</span>
            
            {/* Red badge for critical materials */}
            {criticalCount > 0 && (
              <span className="absolute -top-1 right-2 bg-rose-600 border-2 border-white text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                {criticalCount}
              </span>
            )}
          </button>

          {/* Item 2: Cepat Lapangan */}
          <button
            onClick={() => {
              setActiveTab('quick-action');
            }}
            className={`flex flex-col items-center justify-center py-2 px-3.5 rounded-2xl transition-all relative ${
              activeTab === 'quick-action'
                ? 'text-blue-700 font-extrabold scale-102'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            id="nav-btn-quickaction"
          >
            <div className={`p-2 rounded-full absolute -top-5 border-4 border-slate-50 transition-all ${
              activeTab === 'quick-action' 
                ? 'bg-blue-700 text-white shadow-xl rotate-45 scale-110' 
                : 'bg-slate-800 text-slate-100 shadow-md'
            }`}>
              <Zap className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-[10px] tracking-tight mt-4.5 font-bold">Input Cepat</span>
          </button>

          {/* Item 3: Log Riwayat */}
          <button
            onClick={() => {
              setActiveTab('history');
              setSelectedQuickActionMaterial('');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl relative transition-all ${
              activeTab === 'history'
                ? 'text-blue-700 scale-102 font-bold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            id="nav-btn-history"
          >
            <History className="w-5.5 h-5.5" />
            <span className="text-[10px] tracking-tight mt-1.5 font-bold">Log Riwayat</span>
            <span className="absolute -top-1.5 right-1.5 bg-slate-200 text-slate-600 border border-slate-300 text-[8px] px-1 font-bold rounded-md">
              {logs.length}
            </span>
          </button>

        </nav>

        {/* ========================================================= */}
        {/* INTERACTIVE LOCATION MANAGER MODAL (Constrained to mobile-shell) */}
        {/* ========================================================= */}
        <AnimatePresence>
          {isLocationModalOpen && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end z-50" id="locations-modal-container">
              
              {/* Tap to close backdrop */}
              <div className="absolute inset-0 -z-10" onClick={() => setIsLocationModalOpen(false)} />

              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="bg-white w-full max-h-[85%] rounded-t-[30px] shadow-2xl flex flex-col overflow-hidden border-t border-slate-200"
                id="location-drawer-body"
              >
                {/* Header Indicator / Drag strip */}
                <div className="w-full flex justify-center py-3">
                  <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                </div>

                {/* Modal Title */}
                <div className="px-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-xl text-blue-700">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Pilih & Kelola Lokasi</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Ubah titik pengerjaan proyek atau buat baru</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsLocationModalOpen(false)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-transform"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content Area - Scrollable */}
                <div className="p-5 overflow-y-auto space-y-4 max-h-96 text-slate-800">
                  
                  {/* Status Banner / Error alerts inside modal with safe styles (no standard windows.alert) */}
                  {locationFormError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 px-3 rounded-xl text-xs font-black flex items-center gap-1.5" id="location-error-alert">
                      <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{locationFormError}</span>
                    </div>
                  )}

                  {/* List of currently available construction points/locations */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Daftar Titik Lokasi ({locations.length})</span>
                    
                    <div className="space-y-1.5">
                      {locations.map((loc) => {
                        const isCurrent = loc.id === activeLocationId;
                        // Count materials associated to this location
                        const locMaterials = materials.filter(m => (m.locationId || 'loc-1') === loc.id);
                        const locCritical = locMaterials.filter(m => m.currentStock <= m.minThreshold).length;

                        const isEditingThis = editingLocId === loc.id;

                        if (isEditingThis) {
                          return (
                            <div key={loc.id} className="bg-slate-50 border border-blue-200 rounded-xl p-3 space-y-2.5">
                              <div>
                                <label className="text-[9px] font-extrabold text-slate-400 uppercase block tracking-wider">Nama Lokasi</label>
                                <input
                                  type="text"
                                  value={editingLocName}
                                  onChange={(e) => setEditingLocName(e.target.value)}
                                  className="w-full mt-1 bg-white border border-slate-250 border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-550 text-slate-800 font-bold"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-extrabold text-slate-400 uppercase block tracking-wider">Deskripsi / Detail Pekerjaan</label>
                                <input
                                  type="text"
                                  value={editingLocDesc}
                                  placeholder="Contoh: Pekerjaan lantai 1"
                                  onChange={(e) => setEditingLocDesc(e.target.value)}
                                  className="w-full mt-1 bg-white border border-slate-250 border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-100 text-slate-700"
                                />
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRenameLocation(loc.id, editingLocName, editingLocDesc)}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded-lg text-xs"
                                >
                                  Simpan
                                </button>
                                <button
                                  onClick={() => setEditingLocId(null)}
                                  className="px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-1.5 rounded-lg text-xs"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div 
                            key={loc.id} 
                            className={`flex items-start justify-between p-3 rounded-xl border transition-all ${
                              isCurrent 
                                ? 'bg-blue-50/70 border-blue-300/80 shadow-xs' 
                                : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {/* Left select trigger */}
                            <button
                              onClick={() => handleSelectLocation(loc.id)}
                              className="flex-1 flex items-start gap-2.5 text-left focus:outline-none"
                              title={`Ganti ke lokasi ${loc.name}`}
                            >
                              <div className={`mt-0.5 p-1.5 rounded-lg ${
                                isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                              }`}>
                                <MapPin className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-slate-800 text-xs">{loc.name}</span>
                                  {isCurrent && (
                                    <span className="bg-blue-650 bg-blue-600 text-white text-[8px] px-1.5 py-0.5 font-extrabold rounded-md uppercase tracking-wider scale-90">
                                      Aktif
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 block line-clamp-1 py-0.5 mt-0.5 leading-tight">
                                  {loc.description || 'Tidak ada deskripsi'}
                                </span>
                                
                                {/* Micro statistics */}
                                <div className="flex items-center gap-2 mt-1.5 text-[9px] font-bold">
                                  <span className="text-slate-500 font-mono">🔍 {locMaterials.length} Jenis Material</span>
                                  {locCritical > 0 && (
                                    <span className="text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-1.5 py-0.2 select-none">
                                      ⚠️ {locCritical} Kritis
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>

                            {/* Right edit / delete anchors */}
                            <div className="flex gap-1 shrink-0 ml-2 select-none">
                              <button 
                                onClick={() => {
                                  setEditingLocId(loc.id);
                                  setEditingLocName(loc.name);
                                  setEditingLocDesc(loc.description || '');
                                  setLocationFormError('');
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
                                title="Ubah Nama/Deskripsi Lokasi"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              
                              <button 
                                onClick={() => {
                                  if (locations.length <= 1) {
                                    setLocationFormError('Gagal: Harus menyisakan minimal 1 lokasi proyek aktif!');
                                    return;
                                  }
                                  const c = confirm(`PERINGATAN: Menghapus lokasi "${loc.name}" akan SECARA PERMANEN MENGHAPUS seluruh material (${locMaterials.length}) dan riwayat pekerjaan yang tercatat di lingkungan lokasi ini. Lanjutkan pencopotan?`);
                                  if (c) {
                                    handleDeleteLocation(loc.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
                                title="Hapus Lokasi"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Divider line */}
                  <hr className="border-slate-100" />

                  {/* Form to CREATE a brand new location on the go */}
                  <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 space-y-3" id="add-location-form-block">
                    <div className="flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-blue-600" />
                      <span className="font-extrabold text-xs text-slate-800">Tambah Titik Lokasi Pembangunan Baru</span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase block">Nama Lokasi / Tempat Pekerjaan</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: Pagar Depan, Gedung B Lantai 2" 
                          value={newLocName}
                          onChange={(e) => setNewLocName(e.target.value)}
                          className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-slate-800 font-bold"
                          id="new-location-name-input"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase block text-slate-400">Deskripsi Kegunaan / Catatan Area</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: Pekerjaan pondasi & pagar besi" 
                          value={newLocDesc}
                          onChange={(e) => setNewLocDesc(e.target.value)}
                          className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-slate-700"
                          id="new-location-desc-input"
                        />
                      </div>

                      <button
                        onClick={() => handleAddLocation(newLocName, newLocDesc)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Sertifikasi & Buat Lokasi Baru</span>
                      </button>

                      <p className="text-[9px] text-slate-400 text-center leading-relaxed">
                        *Lokasi baru akan secara otomatis diisikan salinan katalog material standar dengan stok awal 0 units, siap disesuaikan.
                      </p>
                    </div>
                  </div>

                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}
