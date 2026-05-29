import React, { useState, useEffect } from 'react';
import { Material } from '../types';
import { 
  PlusCircle, 
  MinusCircle, 
  User, 
  FileText, 
  Calendar, 
  Sparkles,
  Layers,
  CheckCircle2,
  HardHat,
  ChevronDown,
  Info,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface QuickActionProps {
  materials: Material[];
  onLogTransaction: (
    type: 'incoming' | 'usage',
    materialId: string,
    quantity: number,
    operator: string,
    notes: string,
    customTime?: string
  ) => void;
  selectedMaterialId?: string;
  selectedType?: 'incoming' | 'usage';
  clearSelectedMaterialId: () => void;
  setActiveTab: (tab: 'dashboard' | 'quick-action' | 'history') => void;
}

const COMMON_FOREMEN = [
  'Budi (Mandor)',
  'Supriyadi (Mandor 1)',
  'Slamet (Fabrikasi)',
  'Sutrisno (Finishing)',
  'Heri (Logistik)'
];

const PRESET_INCOMING_NOTES = [
  'Kirim dari Gudang Utama',
  'Pengiriman PO Supplier',
  'Beli eceran dari toko lokal',
  'Sisa pengembalian material',
];

const PRESET_USAGE_NOTES = [
  'Plester dinding',
  'Cor tiang kolom praktis',
  'Pasangan bata merah',
  'Finishing cat ruangan',
  'Pekerjaan lantai & keramik',
  'Instalasi kelistrikan & pipa',
];

export default function QuickAction({
  materials,
  onLogTransaction,
  selectedMaterialId,
  selectedType = 'usage',
  clearSelectedMaterialId,
  setActiveTab,
}: QuickActionProps) {
  const [activeForm, setActiveForm] = useState<'incoming' | 'usage'>(selectedType);
  const [materialId, setMaterialId] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [operator, setOperator] = useState('');
  const [notes, setNotes] = useState('');
  
  // Custom datetime
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');

  const [formSuccess, setFormSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Handle outside activation (e.g., clicking '+' or '-' from a direct material card)
  useEffect(() => {
    if (selectedMaterialId) {
      setMaterialId(selectedMaterialId);
    }
    if (selectedType) {
      setActiveForm(selectedType);
    }
  }, [selectedMaterialId, selectedType]);

  // Sync default user names
  useEffect(() => {
    if (!operator) {
      setOperator(COMMON_FOREMEN[0]);
    }
  }, []);

  // Set default timestamp values
  useEffect(() => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString();
    setCustomDate(localISOTime.slice(0, 10)); // YYYY-MM-DD
    setCustomTime(localISOTime.slice(11, 16)); // HH:MM
  }, []);

  // Retrieve details of the currently selected material
  const selectedMaterial = materials.find(m => m.id === materialId);

  // Validate form requirements
  const isFormValid = () => {
    if (!materialId) return false;
    if (!quantity || quantity <= 0) return false;
    if (!operator.trim()) return false;
    
    // Check if usage quantity exceeds available stock
    if (activeForm === 'usage' && selectedMaterial) {
      if (quantity > selectedMaterial.currentStock) {
        return false;
      }
    }
    return true;
  };

  // Submit hander
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid() || !selectedMaterial) return;

    let fullTimestamp: string;
    try {
      const [year, month, day] = customDate.split('-').map(Number);
      const [hour, minute] = customTime.split(':').map(Number);
      const localDate = new Date(year, month - 1, day, hour, minute);
      fullTimestamp = localDate.toISOString();
    } catch {
      fullTimestamp = new Date().toISOString();
    }

    // Trigger log transaction
    onLogTransaction(
      activeForm,
      materialId,
      Number(quantity),
      operator,
      notes.trim(),
      fullTimestamp
    );

    // Show success dialog
    const typeLabel = activeForm === 'incoming' ? 'ditambahkan' : 'digunakan';
    setSuccessMsg(`Stok "${selectedMaterial.name}" berhasil diperbarui: ${activeForm === 'incoming' ? '+' : '-'}${quantity} ${selectedMaterial.unit}`);
    setFormSuccess(true);
    
    // Clear / Reset form
    setQuantity('');
    setNotes('');
    
    // Clear any temporary selections
    clearSelectedMaterialId();

    setTimeout(() => {
      setFormSuccess(false);
      // Auto redirect to either dashboard or logs as appropriate
      setActiveTab('dashboard');
    }, 2200);
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs" id="quick-action-tab">
      
      {/* Dynamic Success Toast */}
      {formSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-x-4 top-4 bg-emerald-700 text-white rounded-2xl p-4 shadow-xl z-50 flex items-center gap-3.5 max-w-sm mx-auto"
          id="success-action-toast"
        >
          <div className="p-1.5 bg-emerald-800 rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Berhasil Diperbarui</h4>
            <p className="text-xs text-emerald-100 font-light mt-0.5">{successMsg}</p>
          </div>
        </motion.div>
      )}

      {/* Large Foremen Action Selector */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 mb-6" id="form-type-selector">
        {/* TAB 1: (+) Barang Datang */}
        <button
          type="button"
          onClick={() => {
            setActiveForm('incoming');
            clearSelectedMaterialId();
          }}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all ${
            activeForm === 'incoming'
              ? 'bg-emerald-600 text-white shadow-md scale-102'
              : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
          }`}
          id="tab-barang-datang"
        >
          <PlusCircle className="w-5 h-5 shrink-0" />
          <span>Barang Datang (+)</span>
        </button>

        {/* TAB 2: (-) Barang Dipakai */}
        <button
          type="button"
          onClick={() => {
            setActiveForm('usage');
            clearSelectedMaterialId();
          }}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all ${
            activeForm === 'usage'
              ? 'bg-amber-500 text-white shadow-md scale-102'
              : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
          }`}
          id="tab-barang-dipakai"
        >
          <MinusCircle className="w-5 h-5 shrink-0" />
          <span>Barang Dipakai (-)</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" id="quick-action-form">
        
        {/* Form Description Header */}
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <HardHat className={`w-5 h-5 ${activeForm === 'incoming' ? 'text-emerald-600' : 'text-amber-500'}`} />
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              {activeForm === 'incoming' ? 'Pencatatan Material Masuk' : 'Pencatatan Pemakaian Harian'}
            </h3>
            <p className="text-xs text-slate-400">
              {activeForm === 'incoming' 
                ? 'Gunakan form ini jika ada suplai baru tiba di lokasi konstruksi.' 
                : 'Catat material yang ditarik/dipakai pekerja agar stok terpotong teratur.'
              }
            </p>
          </div>
        </div>

        {/* 1. Select Material Dropdown */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 flex justify-between">
            <span>PILIH MATERIAL LAPANGAN</span>
            <span className="text-blue-700 text-[10px] normal-case font-medium">Harus Terdaftar</span>
          </label>
          <div className="relative">
            <select
              required
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm text-slate-800 appearance-none font-semibold cursor-pointer"
            >
              <option value="">-- Ketuk untuk memilih barang --</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.category}) — Sisa: {m.currentStock} {m.unit}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Live Stock Counter Card inside Form */}
        {selectedMaterial && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
              activeForm === 'incoming' 
                ? 'bg-emerald-50/50 border-emerald-100' 
                : 'bg-amber-50/50 border-amber-100'
            }`}
            id="current-stock-preview"
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${activeForm === 'incoming' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Stok Lapangan Sekarang</span>
                <span className="block text-xs text-slate-500">Satuan ukur: <kbd className="font-mono bg-white px-1.5 py-0.5 border border-slate-200 rounded-md font-bold text-slate-800">{selectedMaterial.unit}</kbd></span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono text-slate-800 mr-1">{selectedMaterial.currentStock}</span>
              <span className="text-xs text-slate-500 uppercase font-bold">{selectedMaterial.unit}</span>
            </div>
          </motion.div>
        )}

        {/* 2. Quantity Input */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
            JUMLAH MATERIAL {activeForm === 'incoming' ? 'MASUK (+)' : 'DIPAKAI (-)'}
          </label>
          <div className="relative flex items-center">
            <input
              type="number"
              min="0.01"
              step="any"
              required
              placeholder={`Contoh: 15`}
              value={quantity}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                setQuantity(val);
              }}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-base text-slate-800 font-mono font-bold"
            />
            {selectedMaterial && (
              <span className="absolute right-4 text-xs font-bold font-mono text-slate-400 uppercase select-none">
                {selectedMaterial.unit}
              </span>
            )}
          </div>

          {/* Insufficient Stock Error Flag for Usage Mode */}
          {activeForm === 'usage' && selectedMaterial && quantity !== '' && quantity > selectedMaterial.currentStock && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2"
            >
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <p className="text-xs font-bold">Stok Tidak Mencukupi!</p>
                <p className="text-[11px] text-rose-600/80 mt-0.5">
                  Tukang tidak bisa mengambil {quantity} {selectedMaterial.unit}. Stok lapangan yang tersedia saat ini hanya {selectedMaterial.currentStock} {selectedMaterial.unit}.
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* 3. Operator / Reporter Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
            NAMA MANDOR / PENERIMA LAPANGAN
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="Contoh: Budi (Mandor)"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm text-slate-800 font-medium"
            />
          </div>

          {/* Preset Buttons for Operator Names */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {COMMON_FOREMEN.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setOperator(name)}
                className={`text-[10px] px-2.5 py-1 rounded-md border font-medium transition-all ${
                  operator === name 
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {name.split(' ')[0]} {/* display first name for simplicity */}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Notes / Description */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 flex justify-between">
            <span>CATATAN PEMAKAIAN ATAU SUMBER BARANG</span>
            <span className="text-slate-400 text-[10px] normal-case">Opsional</span>
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <textarea
              rows={2}
              placeholder={
                activeForm === 'incoming' 
                  ? 'Contoh: Kiriman PO #4421 dari CV Mandiri, semen masih kering' 
                  : 'Contoh: Pekerjaan Plester dinding kamar mandi lantai dasar'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm text-slate-800"
            />
          </div>

          {/* Quick-fill notes based on form type */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-1">
              <Sparkles className="w-3 h-3 text-blue-600" /> Cepat isi:
            </span>
            {(activeForm === 'incoming' ? PRESET_INCOMING_NOTES : PRESET_USAGE_NOTES).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setNotes(preset)}
                className="text-[10px] text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-md px-2 py-1 transition-all"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Date & Time Config (Defaults to now, editable) */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" /> TANGGAL KEJADIAN
            </label>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-full bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 font-mono focus:outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1.5">
              WAKTU JAM
            </label>
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="w-full bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 font-mono focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!isFormValid()}
            className={`w-full py-3.5 rounded-2xl text-sm font-bold shadow-md transition-all active:scale-98 ${
              !isFormValid() 
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none' 
                : activeForm === 'incoming' 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10' 
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10'
            }`}
            id="btn-submit-transaction"
          >
            <span>
              {activeForm === 'incoming' ? 'PROSES MASUKKAN BARANG (+)' : 'PROSES PEMAKAIAN BARANG (-)'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
