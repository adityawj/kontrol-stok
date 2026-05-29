import React, { useState, useMemo } from 'react';
import { LogEntry, Material, ProjectLocation } from '../types';
import { 
  History, 
  Search, 
  Download, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  MessageSquare, 
  Calendar,
  Clock,
  User,
  CheckCircle,
  Tag,
  AlertCircle,
  Filter,
  Layers,
  MapPin
} from 'lucide-react';

interface ActivityLogProps {
  logs: LogEntry[];
  materials: Material[];
  onClearLogs: () => void;
  locations?: ProjectLocation[];
  activeLocationId?: string;
}

export default function ActivityLog({ 
  logs, 
  materials, 
  onClearLogs, 
  locations = [], 
  activeLocationId = 'loc-1'
}: ActivityLogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'incoming' | 'usage'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>(activeLocationId);

  // Dynamically query unique categories available in materials
  const categories = useMemo(() => {
    const list = new Set(materials.map(m => m.category));
    return ['All', ...Array.from(list)];
  }, [materials]);

  // Helper function to figure out current stock status level
  const getMaterialStatusLevel = (material: Material) => {
    const { currentStock, minThreshold, warningBuffer } = material;
    if (currentStock <= minThreshold) return 'critical';
    if (currentStock <= minThreshold + warningBuffer) return 'warning';
    return 'safe';
  };

  // Format timestamp helper
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const formatDateLabel = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        const localDay = date.toLocaleDateString('id-ID', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });
        return `HARI INI (${localDay})`;
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'KEMARIN';
      } else {
        return date.toLocaleDateString('id-ID', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }).toUpperCase();
      }
    } catch {
      return 'RIWAYAT SEBELUMNYA';
    }
  };

  // Filter logs based on search terms (material, note, operator) and selection filters
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        const correspondingMaterial = materials.find(m => m.id === log.materialId);

        const matchesSearch = 
          log.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.notes && log.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (correspondingMaterial && correspondingMaterial.category.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesType = selectedType === 'all' || log.type === selectedType;

        // Match category filter
        const matchesCategory = selectedCategory === 'All' || 
          (correspondingMaterial && correspondingMaterial.category === selectedCategory);

        // Match status filter
        let matchesStatus = true;
        if (selectedStatus !== 'all') {
          if (correspondingMaterial) {
            const statusLvl = getMaterialStatusLevel(correspondingMaterial);
            matchesStatus = statusLvl === selectedStatus;
          } else {
            matchesStatus = false;
          }
        }

        // Match location database filter
        const logLocId = log.locationId || 'loc-1';
        const matchesLocation = selectedLocation === 'all' || logLocId === selectedLocation;

        return matchesSearch && matchesType && matchesCategory && matchesStatus && matchesLocation;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, searchTerm, selectedType, selectedCategory, selectedStatus, selectedLocation, materials]);

  // Group filtered logs by date
  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: LogEntry[] } = {};
    filteredLogs.forEach((log) => {
      const dateLabel = formatDateLabel(log.timestamp);
      if (!groups[dateLabel]) {
        groups[dateLabel] = [];
      }
      groups[dateLabel].push(log);
    });
    return groups;
  }, [filteredLogs]);

  // Export Log list as standard CSV trigger
  const handleExportCSV = () => {
    if (logs.length === 0) {
      alert('Tidak ada riwayat untuk diekspor!');
      return;
    }
    
    // Construct CSV Header
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'ID,Tanggal,Waktu,Tipe,Material,Jumlah,Satuan,Petugas,Catatan\n';
    
    // Pop records
    logs.forEach((log) => {
      const dateObj = new Date(log.timestamp);
      const formattedDate = dateObj.toLocaleDateString('id-ID');
      const formattedTime = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const typeLabel = log.type === 'incoming' ? 'MASUK' : 'PAKAI';
      const safeNotes = (log.notes || '-').replace(/"/g, '""');

      csvContent += `${log.id},"${formattedDate}","${formattedTime}","${typeLabel}","${log.materialName}",${log.quantity},"${log.unit}","${log.operator}","${safeNotes}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    
    const todayStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `log_material_lap_${todayStr}.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5" id="history-tab">
      
      {/* Search and Export Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col md:flex-row gap-3 shadow-xs" id="logs-filters">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Cari kata kunci, nama mandor, atau catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:bg-white text-slate-800"
          />
        </div>
        
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex-1 md:flex-initial bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all select-none"
            title="Download CSV"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>
          
          <button
            onClick={() => {
              if (confirm('Apakah Anda yakin ingin MENGHAPUS SEMUA riwayat log aktivitas? Tindakan ini tidak bisa dibatalkan!')) {
                onClearLogs();
              }
            }}
            className="p-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl transition-all"
            title="Bersihkan Semua Log"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Advanced Filter Row (Category, Status, & Location) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 shadow-xs text-xs font-sans" id="logs-advanced-filters">
        {/* Category Dropdown Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>Filter Kategori</span>
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'Semua Kategori' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Current Stock Status Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            <span>Filter Status Stok</span>
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="safe">🟢 Aman</option>
            <option value="warning">🟡 Peringatan</option>
            <option value="critical">🔴 Kritis</option>
          </select>
        </div>

        {/* Location Dropdown Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>Filter Lokasi Proyek</span>
          </label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors cursor-pointer"
          >
            <option value="all font-sans text-xs">🌍 Semua Lokasi</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                📍 {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Type Toggle Filters */}
      <div className="flex gap-1.5 p-1 bg-slate-100/85 rounded-xl border border-slate-200/50" id="logs-type-selector">
        <button
          onClick={() => setSelectedType('all')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            selectedType === 'all' 
              ? 'bg-white text-slate-800 shadow-xs' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Semua Aktivitas ({logs.length})
        </button>
        <button
          onClick={() => setSelectedType('incoming')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-1 ${
            selectedType === 'incoming' 
              ? 'bg-emerald-600 text-white shadow-xs' 
              : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          <ArrowDownLeft className="w-3 h-3" />
          <span>Barang Masuk</span>
        </button>
        <button
          onClick={() => setSelectedType('usage')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-1 ${
            selectedType === 'usage' 
              ? 'bg-amber-500 text-white shadow-xs' 
              : 'text-amber-800 hover:bg-amber-50'
          }`}
        >
          <ArrowUpRight className="w-3 h-3" />
          <span>Dipakai</span>
        </button>
      </div>

      {/* Chat style activity stream feed area */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center">
          <History className="w-12 h-12 text-slate-300 stroke-1 mb-3 animate-pulse" />
          <h5 className="font-semibold text-slate-700">Daftar Log Riwayat Kosong</h5>
          <p className="text-xs text-slate-400 mt-1 max-w-[260px]">
            Belum ada aktivitas terekam. Silakan gunakan tombol Cepat Lapangan untuk melakukan update transaksi stok.
          </p>
        </div>
      ) : (
        <div className="space-y-6" id="logs-stream-feed">
          {Object.keys(groupedLogs).map((dateLabel) => (
            <div key={dateLabel} className="space-y-3">
              {/* WhatsApp-Style Sticky Day Divider Badge */}
              <div className="flex justify-center sticky top-2 z-10">
                <span className="bg-slate-200 text-slate-600 font-extrabold text-[10px] tracking-widest px-3 py-1.5 rounded-full shadow-xs border border-slate-300">
                  {dateLabel}
                </span>
              </div>

              {/* Day's Chat log elements */}
              <div className="space-y-2.5">
                {groupedLogs[dateLabel].map((log) => {
                  const isIncoming = log.type === 'incoming';
                  
                  return (
                    <div 
                      key={log.id} 
                      className={`flex flex-col max-w-[85%] md:max-w-[70%] rounded-2xl p-3.5 shadow-xs border relative ${
                        isIncoming 
                          ? 'mr-auto bg-emerald-50/75 border-emerald-100 text-emerald-950 rounded-tl-none' 
                          : 'ml-auto bg-slate-50 border-slate-200/85 text-slate-900 rounded-tr-none'
                      }`}
                      id={`log-chat-bubble-${log.id}`}
                    >
                      {/* Badge and Indicator icon */}
                      <div className="flex items-center justify-between mb-1.5 select-none gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            isIncoming ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {isIncoming ? (
                              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-700" title="Barang Masuk" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5 text-amber-700" title="Keluar / Digunakan" />
                            )}
                          </span>
                          
                          {/* Operator / Reporter */}
                          <span className="text-xs font-black text-slate-700 tracking-tight flex items-center gap-1">
                            {log.operator}
                          </span>

                          {/* Relative Transaction Mark */}
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            isIncoming ? 'bg-emerald-100/50 text-emerald-800' : 'bg-amber-100/50 text-amber-800'
                          }`}>
                            {isIncoming ? 'MASUK (+)' : 'PAKAI (-)'}
                          </span>
                        </div>

                        {/* Location Badge */}
                        {locations && locations.length > 0 && (
                          <span className="text-[9px] font-extrabold text-blue-700/85 bg-blue-50/80 border border-blue-100 rounded-md px-1.5 py-0.5 flex items-center gap-0.5" title="Lokasi Pencatatan Transaksi">
                            <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                            <span className="line-clamp-1 max-w-[80px]">
                              {locations.find(l => l.id === (log.locationId || 'loc-1'))?.name || 'Pabrik Utama'}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Chat Message Main Content Bubble */}
                      <p className="text-sm font-medium leading-relaxed">
                        {isIncoming ? 'Menambahkan' : 'Mengurangi'} <span className="font-extrabold text-blue-700 font-mono text-base">{log.quantity}</span> {log.unit} <span className="font-bold underline text-slate-900 decoration-slate-300 decoration-2">{log.materialName}</span>
                      </p>

                      {/* Notes Section if any */}
                      {log.notes && (
                        <div className="mt-2 text-xs bg-white/70 border border-slate-100 rounded-lg p-2 italic text-stone-600 flex gap-1.5 items-start">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>"{log.notes}"</span>
                        </div>
                      )}

                      {/* Micro Timestamp placed on bottom-right of the WhatsApp bubble */}
                      <div className="mt-1.5 flex items-center justify-end gap-1 text-[9px] text-slate-400 font-bold font-mono">
                        <Clock className="w-3 h-3 text-slate-300" />
                        <span>{formatTime(log.timestamp)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
