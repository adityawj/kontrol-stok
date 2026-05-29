import React, { useState, useMemo } from 'react';
import { Material, FilterType } from '../types';
import { 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Edit3, 
  Trash2, 
  Filter,
  Layers,
  Sparkles,
  ChevronRight,
  Package,
  X,
  Gauge,
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  materials: Material[];
  onAddMaterial: (material: Omit<Material, 'id' | 'lastUpdated'>) => void;
  onEditMaterial: (material: Material) => void;
  onDeleteMaterial: (id: string) => void;
  setActiveTab: (tab: 'dashboard' | 'quick-action' | 'history') => void;
  setSelectedQuickActionMaterial: (id: string) => void;
  setSelectedQuickActionType: (type: 'incoming' | 'usage') => void;
}

export default function Dashboard({
  materials,
  onAddMaterial,
  onEditMaterial,
  onDeleteMaterial,
  setActiveTab,
  setSelectedQuickActionMaterial,
  setSelectedQuickActionType
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  
  // States for Manage Material Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  
  // Form fields for adding/editing materials
  const [formData, setFormData] = useState({
    name: '',
    category: 'Semen',
    currentStock: 10,
    unit: 'Sak',
    minThreshold: 10,
    warningBuffer: 5,
  });

  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [groupByCategory, setGroupByCategory] = useState(false);

  // Dynamic list of preset categories combined with existing materials categories
  const DEFAULT_PRESET_CATEGORIES = [
    'Semen',
    'Logam (Besi/Paku)',
    'Agregat (Pasir/Batu)',
    'Struktur (Bata/Lantai)',
    'Finishing (Cat/Keramik)',
    'Plumbing (Pipa AW)',
    'Kelistrikan',
    'Lain-lain'
  ];

  const uniqueExistingCategories = useMemo(() => {
    const list = new Set(materials.map(m => m.category));
    return Array.from(list);
  }, [materials]);

  // Combined categories for Filter selection at construction
  const categories = useMemo(() => {
    const list = new Set(['All', ...DEFAULT_PRESET_CATEGORIES, ...uniqueExistingCategories]);
    return Array.from(list);
  }, [materials]);

  // Categories available for the drop-down select option (not including 'All')
  const formSelectionCategories = useMemo(() => {
    const list = new Set([...DEFAULT_PRESET_CATEGORIES, ...uniqueExistingCategories]);
    return Array.from(list).filter(c => c !== 'All' && c !== '');
  }, [materials]);

  // Helper to determine status and colors
  const getMaterialStatus = (material: Material) => {
    const { currentStock, minThreshold, warningBuffer } = material;
    if (currentStock <= minThreshold) {
      return {
        level: 'critical' as const,
        label: 'KRITIS',
        colorClass: 'bg-rose-50 border-rose-200 text-rose-800 focus:ring-rose-200',
        badgeClass: 'bg-rose-100 text-rose-700 border-rose-200',
        barColor: 'bg-rose-600',
        icon: <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />,
        desc: 'Stok Kritis, segera order ulang!'
      };
    } else if (currentStock <= minThreshold + warningBuffer) {
      return {
        level: 'warning' as const,
        label: 'PERINGATAN',
        colorClass: 'bg-amber-50 border-amber-200 text-amber-800 focus:ring-amber-200',
        badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
        barColor: 'bg-amber-500',
        icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        desc: 'Stok mendekati batas aman'
      };
    } else {
      return {
        level: 'safe' as const,
        label: 'AMAN',
        colorClass: 'bg-emerald-50 border-emerald-200 text-emerald-800 focus:ring-emerald-200',
        badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        barColor: 'bg-emerald-500',
        icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
        desc: 'Stok aman terkendali'
      };
    }
  };

  // Filter materials based on search, category, and status levels
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'All' || m.category === selectedCategory;
      
      const status = getMaterialStatus(m);
      const matchStatus = statusFilter === 'all' || status.level === statusFilter;
      
      return matchSearch && matchCategory && matchStatus;
    });
  }, [materials, searchTerm, selectedCategory, statusFilter]);

  // Calculate stats for top banner
  const stats = useMemo(() => {
    let criticalCount = 0;
    let warningCount = 0;
    let safeCount = 0;

    materials.forEach(m => {
      const status = getMaterialStatus(m);
      if (status.level === 'critical') criticalCount++;
      else if (status.level === 'warning') warningCount++;
      else safeCount++;
    });

    return { criticalCount, warningCount, safeCount, total: materials.length };
  }, [materials]);

  // Grouped filtered materials helper
  const groupedFilteredMaterials = useMemo(() => {
    const groups: { [category: string]: Material[] } = {};
    filteredMaterials.forEach(m => {
      if (!groups[m.category]) {
        groups[m.category] = [];
      }
      groups[m.category].push(m);
    });
    return groups;
  }, [filteredMaterials]);

  const renderMaterialCard = (mat: Material) => {
    const status = getMaterialStatus(mat);
    const maxScale = Math.max(mat.currentStock, mat.minThreshold + mat.warningBuffer) * 1.3 || 100;
    const ratio = Math.min((mat.currentStock / maxScale) * 100, 100);
    const minRatio = (mat.minThreshold / maxScale) * 100;
    const warnRatio = ((mat.minThreshold + mat.warningBuffer) / maxScale) * 100;

    return (
      <motion.div
        key={mat.id}
        layoutId={`card-${mat.id}`}
        className={`bg-white rounded-xl p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-lg border-t border-r border-b ${
          status.level === 'critical' ? 'border-l-8 border-l-red-500 border-red-100 ring-2 ring-red-50/50' : 
          status.level === 'warning' ? 'border-l-8 border-l-yellow-400 border-amber-100 ring-2 ring-amber-50/50' : 
          'border-l-8 border-l-green-500 border-slate-100'
        }`}
        id={`material-card-${mat.id}`}
      >
        {/* Status Strip At Top */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-1.5 py-0.5 bg-slate-100 rounded-md">
              {mat.category}
            </span>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight mt-1 line-clamp-1" title={mat.name}>
              {mat.name}
            </h3>
          </div>

          {/* Badge */}
          <span className={`text-[10px] font-black tracking-widest px-2 py-1 rounded-lg border flex items-center gap-1 shrink-0 select-none ${status.badgeClass}`}>
            <span className="relative flex h-1.5 w-1.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.level === 'critical' ? 'bg-rose-500' : status.level === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${status.level === 'critical' ? 'bg-rose-600' : status.level === 'warning' ? 'bg-amber-600' : 'bg-emerald-600'}`}></span>
            </span>
            {status.label}
          </span>
        </div>

        {/* Stock values display */}
        <div className="my-3 flex items-end justify-between">
          <div>
            <span className="text-stone-400 text-xs font-medium block">Stok Lapangan saat ini</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight ${
                status.level === 'critical' ? 'text-rose-600' :
                status.level === 'warning' ? 'text-amber-600' : 'text-slate-800'
              }`}>
                {mat.currentStock}
              </span>
              <span className="text-sm font-semibold text-slate-500 uppercase">{mat.unit}</span>
            </div>
          </div>

          <div className="text-right text-xs text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 min-w-[140px]">
            <div className="flex justify-between items-center gap-2">
              <span>Aman Min:</span>
              <span className="font-bold font-mono text-slate-800">{mat.minThreshold} {mat.unit}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span>Batas Alert:</span>
              <span className="font-bold font-mono text-slate-800">{mat.minThreshold + mat.warningBuffer} {mat.unit}</span>
            </div>
          </div>
        </div>

        {/* Visual gauge representation bar code */}
        <div className="mt-2 mb-4 space-y-1">
          <div className="w-full bg-slate-100 rounded-full h-3.5 relative overflow-hidden flex items-center border border-slate-200">
            {/* Threshold warning boundary mark */}
            <div 
              className="absolute h-full border-r border-slate-300 bg-amber-200/40 opacity-50"
              style={{ width: `${warnRatio}%` }}
            />
            {/* Critical boundary mark */}
            <div 
              className="absolute h-full border-r border-rose-300 bg-rose-200/20"
              style={{ width: `${minRatio}%` }}
            />
            {/* Current Stock Active Fill */}
            <motion.div 
              className={`h-full rounded-full ${status.barColor}`} 
              initial={{ width: 0 }}
              animate={{ width: `${ratio}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          {/* Status hint block */}
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium px-0.5">
            <span>0 {mat.unit}</span>
            <span className="flex items-center gap-0.5">
              {status.icon}
              <span className={
                status.level === 'critical' ? 'text-rose-600 font-bold' :
                status.level === 'warning' ? 'text-amber-600 font-bold' : 'text-emerald-700'
              }>
                {status.desc}
              </span>
            </span>
          </div>
        </div>

        {/* Action Shortcuts Section - Custom design for easier mobile use */}
        <div className="border-t border-slate-100 pt-3 flex items-center gap-2 justify-between mt-1">
          {/* Catalog management buttons */}
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => handleOpenEditModal(mat)}
              className="p-2 text-slate-400 hover:text-blue-700 hover:bg-slate-50 rounded-xl transition-all"
              title="Edit detail material"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => {
                if (confirm(`Apakah Anda yakin ingin menghapus data material "${mat.name}"?\nSemua riwayat pengeluaran tidak akan terpengaruh.`)) {
                  onDeleteMaterial(mat.id);
                }
              }}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded-xl transition-all"
              title="Hapus material dari database"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Large Quick Incrementor/Decrementor Buttons for Foremen */}
          <div className="flex items-center gap-1">
            {/* Barang Dipakai (-) button */}
            <button
              onClick={() => triggerQuickAction(mat.id, 'usage')}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-all active:scale-95"
            >
              <span className="text-sm font-black leading-none">-</span> Gunakan
            </button>
            {/* Barang Datang (+) button */}
            <button
              onClick={() => triggerQuickAction(mat.id, 'incoming')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-all active:scale-95"
            >
              <span className="text-sm font-black leading-none">+</span> Datang
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const handleOpenAddModal = () => {
    setEditingMaterial(null);
    setFormData({
      name: '',
      category: formSelectionCategories[0] || 'Semen',
      currentStock: 20,
      unit: 'Sak',
      minThreshold: 10,
      warningBuffer: 5,
    });
    setIsNewCategory(false);
    setNewCategoryName('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      category: material.category,
      currentStock: material.currentStock,
      unit: material.unit,
      minThreshold: material.minThreshold,
      warningBuffer: material.warningBuffer,
    });
    setIsNewCategory(false);
    setNewCategoryName('');
    setIsModalOpen(true);
  };

  const handleSubmitMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const finalCategory = isNewCategory ? (newCategoryName.trim() || 'Lain-lain') : formData.category;

    if (editingMaterial) {
      onEditMaterial({
        ...editingMaterial,
        ...formData,
        category: finalCategory,
        lastUpdated: new Date().toISOString()
      });
    } else {
      onAddMaterial({
        ...formData,
        category: finalCategory,
      });
    }
    setIsModalOpen(false);
  };

  const triggerQuickAction = (materialId: string, type: 'incoming' | 'usage') => {
    setSelectedQuickActionMaterial(materialId);
    setSelectedQuickActionType(type);
    setActiveTab('quick-action');
  };

  return (
    <div className="space-y-6" id="dashboard-tab">
      {/* Dynamic Action-Based Alerts Panel */}
      {stats.criticalCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500 border border-red-600 text-white rounded-2xl p-4 shadow-lg flex items-start gap-3.5"
          id="danger-alert-banner"
        >
          <div className="p-2 bg-red-600/50 rounded-lg animate-pulse">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm tracking-wide">PERINGATAN STOK KRITIS!</h4>
            <p className="text-xs text-red-100 font-light mt-1">
              Ada <span className="font-bold underline">{stats.criticalCount} material</span> yang sudah menyentuh atau di bawah angka aman minimum. Segera lakukan pemesanan ulang untuk menjaga kelancaran konstruksi di lapangan!
            </p>
          </div>
        </motion.div>
      )}

      {/* Top Statistical Cards Container */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4" id="stat-cards-container">
        {/* Critical */}
        <button 
          onClick={() => setStatusFilter(statusFilter === 'critical' ? 'all' : 'critical')}
          className={`flex flex-col items-center sm:items-start p-3 rounded-2xl border transition-all text-left ${
            statusFilter === 'critical' 
              ? 'bg-rose-500 border-rose-600 text-white shadow-md' 
              : 'bg-white border-slate-100 hover:border-rose-200 text-slate-800'
          }`}
          id="stat-critical-card"
        >
          <span className={`text-[10px] font-bold tracking-wider ${statusFilter === 'critical' ? 'text-rose-100' : 'text-slate-400'}`}>KRITIS</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl sm:text-2xl font-black font-mono">{stats.criticalCount}</span>
            <span className="text-xs font-light">item</span>
          </div>
          <div className={`mt-2 w-2 h-2 rounded-full bg-rose-500 ${statusFilter === 'critical' ? 'hidden' : 'animate-ping'}`} />
        </button>

        {/* Warning */}
        <button 
          onClick={() => setStatusFilter(statusFilter === 'warning' ? 'all' : 'warning')}
          className={`flex flex-col items-center sm:items-start p-3 rounded-2xl border transition-all text-left ${
            statusFilter === 'warning' 
              ? 'bg-amber-500 border-amber-600 text-white shadow-md' 
              : 'bg-white border-slate-100 hover:border-amber-200 text-slate-800'
          }`}
          id="stat-warning-card"
        >
          <span className={`text-[10px] font-bold tracking-wider ${statusFilter === 'warning' ? 'text-amber-100' : 'text-slate-400'}`}>PERINGATAN</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl sm:text-2xl font-black font-mono">{stats.warningCount}</span>
            <span className="text-xs font-light">item</span>
          </div>
          <div className={`mt-2 w-2 h-2 rounded-full bg-amber-500 ${statusFilter === 'warning' ? 'hidden' : ''}`} />
        </button>

        {/* Safe */}
        <button 
          onClick={() => setStatusFilter(statusFilter === 'safe' ? 'all' : 'safe')}
          className={`flex flex-col items-center sm:items-start p-3 rounded-2xl border transition-all text-left ${
            statusFilter === 'safe' 
              ? 'bg-emerald-500 border-emerald-600 text-white shadow-md' 
              : 'bg-white border-slate-100 hover:border-emerald-200 text-slate-800'
          }`}
          id="stat-safe-card"
        >
          <span className={`text-[10px] font-bold tracking-wider ${statusFilter === 'safe' ? 'text-emerald-100' : 'text-slate-400'}`}>AMAN</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl sm:text-2xl font-black font-mono">{stats.safeCount}</span>
            <span className="text-xs font-light">item</span>
          </div>
          <div className={`mt-2 w-2 h-2 rounded-full bg-emerald-500 ${statusFilter === 'safe' ? 'hidden' : ''}`} />
        </button>
      </div>

      {/* Control Tools Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-4 shadow-sm" id="control-tools-bar">
        {/* Row 1: Search & Add */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Cari material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-slate-800"
            />
          </div>
          <button
            onClick={handleOpenAddModal}
            className="bg-blue-800 hover:bg-blue-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors active:scale-98"
            id="btn-add-material-trigger"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Material</span>
          </button>
        </div>

        {/* Row 2: Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none" id="categories-scroll">
          <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="flex gap-1.5 pl-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-blue-800 border-blue-800 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat === 'All' ? 'Semua Kategori' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Group by Category Toggle for Organizer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
          <span className="text-slate-500 font-medium">Tata Letak Dashboard:</span>
          <button
            type="button"
            onClick={() => setGroupByCategory(prev => !prev)}
            className={`px-2.5 py-1.5 rounded-lg font-bold border transition-all flex items-center gap-1 ${
              groupByCategory 
                ? 'bg-blue-50 border-blue-200 text-blue-800' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{groupByCategory ? '📌 Urut per Kategori' : '📋 Daftar Linear'}</span>
          </button>
        </div>
      </div>

      {/* Material Grid / Cards Section */}
      <div className="space-y-4" id="materials-grid-section">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
          <span>MENAMPILKAN {filteredMaterials.length} DARI {materials.length} MATERIAL</span>
          {statusFilter !== 'all' && (
            <button 
              onClick={() => setStatusFilter('all')}
              className="text-blue-700 font-bold hover:underline"
            >
              Reset Filter Status
            </button>
          )}
        </div>

        {filteredMaterials.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6">
            <Package className="w-12 h-12 text-slate-300 stroke-1 mb-3 animate-pulse" />
            <h5 className="font-semibold text-slate-700">Tidak ada material</h5>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
              Coba ganti kata pencarian atau ubah filter kategori/status Anda.
            </p>
          </div>
        ) : groupByCategory ? (
          /* Grouped Layout per Category */
          <div className="space-y-6" id="grouped-cards-container">
            {Object.entries(groupedFilteredMaterials).map(([catName, items]) => {
              const itemsList = items as Material[];
              if (itemsList.length === 0) return null;
              return (
                <div key={catName} className="space-y-2.5" id={`category-block-${catName.replace(/\s+/g, '-').toLowerCase()}`}>
                  <div className="flex items-center gap-2 border-b border-slate-200/65 pb-1.5 pt-1">
                    <span className="h-4 w-1 bg-blue-750 bg-blue-800 rounded-full"></span>
                    <h4 className="font-extrabold text-xs text-slate-705 text-slate-800 tracking-widest uppercase flex items-center gap-1.5">
                      <span>{catName}</span>
                      <span className="font-mono text-[10px] text-slate-400 font-normal lowercase">({itemsList.length} item)</span>
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {itemsList.map(mat => renderMaterialCard(mat))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Flat Linear Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="cards-grid">
            {filteredMaterials.map((mat) => renderMaterialCard(mat))}
          </div>
        )}
      </div>

      {/* Catalog & Materials Editing Modal Form Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-100"
              id="material-form-modal"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="font-bold text-slate-800 text-lg">
                  {editingMaterial ? 'Edit Parameter Material' : 'Tambah Material Lapangan Baru'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-stone-400 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmitMaterial} className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Material Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Nama Material</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Semen Gresik PPC"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category Selection Container */}
                  <div className="flex flex-col gap-2 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Pilih Kategori</label>
                      <select
                        value={isNewCategory ? '__NEW__' : formData.category}
                        onChange={(e) => {
                          if (e.target.value === '__NEW__') {
                            setIsNewCategory(true);
                          } else {
                            setIsNewCategory(false);
                            setFormData({ ...formData, category: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-xs bg-white text-slate-800 font-semibold cursor-pointer"
                      >
                        {formSelectionCategories.map(catOpt => (
                          <option key={catOpt} value={catOpt}>{catOpt}</option>
                        ))}
                        <option value="__NEW__">➕ + Kateg. Baru...</option>
                      </select>
                    </div>

                    {/* New Category dynamic input */}
                    {isNewCategory && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-1 mt-1"
                      >
                        <label className="block text-[10px] font-bold text-blue-700 uppercase">Nama Kategori Baru</label>
                        <input
                          type="text"
                          required
                          placeholder="Misal: Elektrikal, Alat"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-blue-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs text-slate-800 font-medium"
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Material Unit */}
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex flex-col justify-start">
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Satuan Ukuran</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Sak, m³, Batang, Dus"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-xs text-slate-850 bg-white font-medium"
                    />
                  </div>
                </div>

                {/* Current Stock */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Stok Saat Ini (Saldo Awal)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm text-slate-800 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {/* Minimum Threshold */}
                  <div>
                    <label className="block text-xs font-bold text-rose-700 uppercase mb-1">
                      Batas Kritis (Stok Min)
                    </label>
                    <p className="text-[10px] text-slate-400 mb-1.5">Bawah ini ➡️ Merah</p>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.minThreshold}
                      onChange={(e) => setFormData({ ...formData, minThreshold: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2 border border-rose-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm text-rose-900 font-mono"
                    />
                  </div>

                  {/* Warning Buffer */}
                  <div>
                    <label className="block text-xs font-bold text-amber-700 uppercase mb-1">
                      Rentang Peringatan
                    </label>
                    <p className="text-[10px] text-slate-400 mb-1.5">Selisih di atas Min ➡️ Kuning</p>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.warningBuffer}
                      onChange={(e) => setFormData({ ...formData, warningBuffer: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2 border border-amber-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm text-amber-900 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white z-10 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 active:scale-98 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-sm font-semibold shadow-xs active:scale-98 transition-all"
                  >
                    {editingMaterial ? 'Simpan Perubahan' : 'Daftarkan Material'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
