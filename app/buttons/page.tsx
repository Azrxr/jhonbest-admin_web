"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, writeBatch, deleteDoc, setDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Power, HelpCircle, X, ExternalLink, Pencil, Trash2, Link as LinkIcon } from "lucide-react";

export default function ButtonsManagement() {
  const [buttons, setButtons] = useState<any[]>([]);
  const [isMasterConfirmOpen, setIsMasterConfirmOpen] = useState(false);
  const [masterActionType, setMasterActionType] = useState<"on" | "off" | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formDocId, setFormDocId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formOpenMode, setFormOpenMode] = useState<"internal" | "external">("internal");
  const [formOrder, setFormOrder] = useState<number | "">("");
  const [formUrl, setFormUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "buttons"), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setButtons(docsData);
    });
    return () => unsubscribe();
  }, []);

  // Compute master state (True jika ada minimal 1 yang aktif, False jika semua mati)
  const isMasterOn = buttons.length > 0 && buttons.some(b => b.isActive);

  // Quick edit status toggle
  const toggleStatus = async (id: string, currentStatus: boolean) => {
    await updateDoc(doc(db, "buttons", id), { isActive: !currentStatus });
  };

  // Quick edit open mode
  const toggleOpenMode = async (id: string, currentMode: string) => {
    const newMode = currentMode === "internal" ? "external" : "internal";
    await updateDoc(doc(db, "buttons", id), { openMode: newMode });
  };

  const deleteButton = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus tombol ini?")) {
      await deleteDoc(doc(db, "buttons", id));
    }
  };

  // Master switch executor
  const executeMasterSwitch = async () => {
    if (!masterActionType) return;
    const batch = writeBatch(db);
    buttons.forEach((btn) => {
      const ref = doc(db, "buttons", btn.id);
      batch.update(ref, { isActive: masterActionType === "on" });
    });
    await batch.commit();
    setIsMasterConfirmOpen(false);
  };

  const handleMasterToggleChange = () => {
    // If master is ON, turning it off means matikan semua. If OFF, nyalakan semua.
    setMasterActionType(isMasterOn ? "off" : "on");
    setIsMasterConfirmOpen(true);
  };

  // Open Form
  const openForm = (btn?: any) => {
    setFormError("");
    if (btn) {
      setFormDocId(btn.id);
      setFormTitle(btn.title);
      setFormIsActive(btn.isActive);
      setFormOpenMode(btn.openMode);
      setFormOrder(btn.order);
      setFormUrl(btn.url);
    } else {
      setFormDocId(null);
      setFormTitle("");
      setFormIsActive(true);
      setFormOpenMode("internal");
      // Auto assign next order
      const maxOrder = buttons.length > 0 ? Math.max(...buttons.map(b => b.order)) : 0;
      setFormOrder(maxOrder + 1);
      setFormUrl("");
    }
    setIsFormOpen(true);
  };

  const isValidHttpUrl = (string: string) => {
    let url;
    try {
      url = new URL(string);
    } catch (_) {
      return false;  
    }
    return url.protocol === "http:" || url.protocol === "https:";
  }

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || formOrder === "" || !formUrl) {
      setFormError("Semua kolom (Judul, Urutan, URL) harus diisi.");
      return;
    }
    if (!isValidHttpUrl(formUrl)) {
      setFormError("URL tidak valid. Harus diawali http:// atau https://");
      return;
    }

    setIsSaving(true);
    setFormError("");
    try {
      if (formDocId) {
        // Edit Mode
        await updateDoc(doc(db, "buttons", formDocId), {
          title: formTitle,
          isActive: formIsActive,
          openMode: formOpenMode,
          order: Number(formOrder),
          url: formUrl
        });
      } else {
        // Add mode -> Let firebase general auto ID
        const newRef = doc(collection(db, "buttons"));
        await setDoc(newRef, {
          title: formTitle,
          isActive: formIsActive,
          openMode: formOpenMode,
          order: Number(formOrder),
          url: formUrl
        });
      }
      setIsFormOpen(false);
    } catch (error: any) {
      setFormError("Gagal menyimpan data: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Manajemen Tombol</h1>
          <p className="text-foreground/70">Atur seluruh tombol cepat aktif aplikasi Jhonbest.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsInfoOpen(true)}
            className="p-3 bg-card-bg text-gold-500 border border-card-border rounded-xl hover:bg-gold-500/10 transition-colors"
            title="Penjelasan Fields"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => openForm()}
            className="flex-1 sm:flex-none px-4 py-3 bg-gold-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gold-600 transition-colors shadow-[0_0_15px_rgba(255,215,0,0.3)]"
          >
            <Plus className="w-5 h-5" /> Tambah Baru
          </button>
        </div>
      </div>

      {/* Master Switch UI */}
      <div className="glass-panel p-6 rounded-2xl mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 border-l-4 border-l-gold-500">
        <div className="text-center sm:text-left flex-1">
          <h2 className="text-xl font-bold mb-1 flex items-center justify-center sm:justify-start gap-2">
            <Power className="w-5 h-5 text-gold-500" /> Saklar Utama Terpusat
          </h2>
          <p className="text-sm text-foreground/70">Tekan saklar untuk menghidupkan atau mematikan seluruh tombol secara langsung.</p>
        </div>
        
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button
            onClick={handleMasterToggleChange}
            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 ${
              isMasterOn ? 'bg-emerald-500 shadow-[0_0_15px_#10b98180]' : 'bg-red-500 shadow-[0_0_15px_#ef444480]'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${
                isMasterOn ? 'translate-x-[34px]' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-xs font-bold uppercase ${isMasterOn ? 'text-emerald-500' : 'text-red-500'}`}>
            {isMasterOn ? 'Semua Hidup' : 'Semua Mati'}
          </span>
        </div>
      </div>

      {/* List of Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buttons.length === 0 ? (
           <p className="text-foreground/50 py-8 col-span-full text-center border-2 border-dashed border-card-border rounded-2xl">Belum ada tombol tersimpan.</p>
        ) : (
          buttons.map((btn) => (
            <div key={btn.id} className="glass-panel rounded-2xl p-6 flex flex-col justify-between hover:border-gold-500/50 transition-all relative overflow-hidden group shadow-lg">
              {btn.isActive ? (
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-all duration-500" />
              ) : (
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-all duration-500" />
              )}
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                  <span className="text-xs text-gold-500 font-bold mb-1 tracking-wider uppercase">Order: {btn.order}</span>
                  <h3 className="font-bold text-xl drop-shadow-sm">{btn.title}</h3>
                </div>
                
                {/* Visual Toggle for isActive */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => toggleStatus(btn.id, btn.isActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 shadow-inner ${
                      btn.isActive ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${btn.isActive ? 'translate-x-[22px]' : 'translate-x-1'}`} />
                  </button>
                  <span className={`text-[10px] font-bold ${btn.isActive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {btn.isActive ? 'AKTIF' : 'MATI'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 mb-6 flex-1">
                {/* Visual Toggle for openMode */}
                <div className="flex justify-between items-center bg-card-bg/60 border border-card-border p-3 rounded-xl">
                  <span className="text-sm font-semibold text-foreground/80">Mode Buka</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase transition-colors ${btn.openMode === 'internal' ? 'text-gold-500' : 'text-foreground/40'}`}>IN</span>
                    <button
                      onClick={() => toggleOpenMode(btn.id, btn.openMode)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 ${
                        btn.openMode === 'external' ? 'bg-indigo-500' : 'bg-gold-500'
                      }`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${btn.openMode === 'external' ? 'translate-x-[18px]' : 'translate-x-1'}`} />
                    </button>
                    <span className={`text-[10px] font-bold uppercase transition-colors ${btn.openMode === 'external' ? 'text-indigo-400' : 'text-foreground/40'}`}>EXT</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-card-bg/60 border border-card-border p-3 rounded-xl group/link transition-colors hover:border-gold-500/30">
                  <LinkIcon className="w-4 h-4 text-gold-500 shrink-0" />
                  <span className="truncate flex-1 font-mono text-[11px] text-foreground/80">{btn.url}</span>
                  <a href={btn.url} target="_blank" rel="noopener noreferrer" className="shrink-0 p-1.5 bg-card-border rounded-md text-gold-500 hover:bg-gold-500 hover:text-black transition-all" title="Akses Langsung">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => openForm(btn)}
                  className="flex-1 bg-card-bg border border-card-border p-2.5 rounded-xl text-sm font-semibold hover:bg-gold-500 hover:text-black hover:border-gold-500 transition-all flex items-center justify-center gap-2 group/edit"
                >
                  <Pencil className="w-4 h-4 text-gold-500 group-hover/edit:text-black transition-colors" /> Edit
                </button>
                <button 
                  onClick={() => deleteButton(btn.id)}
                  className="px-3 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  title="Hapus Murni"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Modal */}
      {isInfoOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-card-bg border border-card-border w-full max-w-lg rounded-2xl p-6 relative shadow-2xl animate-in slide-in-from-bottom-10 fade-in zoom-in-95">
            <button onClick={() => setIsInfoOpen(false)} className="absolute top-4 right-4 text-foreground/50 hover:text-foreground">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gold-500">
              <HelpCircle className="w-6 h-6" /> Penjelasan Field Data
            </h2>
            <div className="space-y-4 text-sm">
              <div className="p-3 bg-card-bg border border-card-border rounded-lg">
                <span className="font-bold text-gold-500 flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" /> isActive
                </span>
                Menentukan status tombol. Jika <code className="text-emerald-400">true</code>, link terbuka normal. Jika <code className="text-red-400">false</code>, akan memunculkan Toast <i>"Fitur sedang dalam maintenance"</i>.
              </div>
              
              <div className="p-3 bg-card-bg border border-card-border rounded-lg">
                <span className="font-bold text-gold-500 flex items-center gap-2">openMode</span>
                <span className="font-mono text-gold-500 text-xs">internal</span> (Buka di dalam aplikasi / WebView) atau <span className="font-mono text-indigo-400 text-xs">external</span> (Buka di browser bawaan HP seperti Chrome).
              </div>
              
              <div className="p-3 bg-card-bg border border-card-border rounded-lg">
                <span className="font-bold text-gold-500">order</span><br/>
                Berfungsi sebagai ID pemanggil Unik. Angka ini yang dipanggil pada kode Android (contoh: <code className="text-gray-400">handleClick(context, 2)</code>).
              </div>
              
              <div className="p-3 bg-card-bg border border-card-border rounded-lg">
                <span className="font-bold text-gold-500">title</span><br/>
                Hanya sebagai nama penanda agar Anda mudah membedakan tombol di Firebase. (Tidak mengubah teks di UI aplikasi Android).
              </div>
              
              <div className="p-3 bg-card-bg border border-card-border rounded-lg">
                <span className="font-bold text-gold-500">url</span><br/>
                Tautan yang akan dituju. Jika dikosongkan, tombol akan memunculkan Toast <i>"Fitur segera hadir"</i>.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Drawer / Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-card-bg sm:border border-card-border w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6 sm:p-8 relative shadow-2xl animate-in slide-in-from-bottom-[50vh] sm:slide-in-from-bottom-10 sm:fade-in zoom-in-95">
            <button onClick={() => setIsFormOpen(false)} className="absolute top-6 right-6 text-foreground/50 hover:text-foreground bg-card-border/50 p-2 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-foreground">
              {formDocId ? "Edit Tombol" : "Tambah Baru"}
            </h2>

            {formError && (
              <div className="p-3 mb-6 border border-red-500/50 bg-red-500/10 text-red-500 text-sm rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveDoc} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground/70 mb-1 block">Judul (Title)</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-xl p-3 focus:outline-none focus:border-gold-500 transition-colors"
                  placeholder="Contoh: Daftar VIP"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-background border border-card-border p-3 rounded-xl flex flex-col justify-center items-center">
                    <label className="text-sm font-semibold text-foreground/70 mb-3 block">Status</label>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold ${!formIsActive ? 'text-red-500' : 'text-foreground/40'}`}>OFF</span>
                      <button
                        type="button"
                        onClick={() => setFormIsActive(!formIsActive)}
                        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-300 ${
                          formIsActive ? 'bg-emerald-500 shadow-md' : 'bg-red-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${formIsActive ? 'translate-x-[26px]' : 'translate-x-1'}`} />
                      </button>
                      <span className={`text-xs font-bold ${formIsActive ? 'text-emerald-500' : 'text-foreground/40'}`}>ON</span>
                    </div>
                 </div>
                 <div className="bg-background border border-card-border p-3 rounded-xl flex flex-col justify-center items-center">
                    <label className="text-sm font-semibold text-foreground/70 mb-3 block text-center">Open Mode</label>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${formOpenMode === 'internal' ? 'text-gold-500' : 'text-foreground/40'}`}>INT</span>
                      <button
                        type="button"
                        onClick={() => setFormOpenMode(formOpenMode === 'internal' ? 'external' : 'internal')}
                        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-300 ${
                          formOpenMode === 'external' ? 'bg-indigo-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]' : 'bg-gold-500 shadow-md'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${formOpenMode === 'external' ? 'translate-x-[26px]' : 'translate-x-1'}`} />
                      </button>
                      <span className={`text-[10px] font-bold ${formOpenMode === 'external' ? 'text-indigo-400' : 'text-foreground/40'}`}>EXT</span>
                    </div>
                 </div>
              </div>

               <div>
                <label className="text-sm font-semibold text-foreground/70 mb-1 block flex justify-between">
                  <span>Urutan (Order)</span>
                  <span className="text-xs font-normal opacity-50 text-gold-500">Auto-generated Uniq</span>
                </label>
                <input 
                  type="number" 
                  required
                  min="0"
                  value={formOrder}
                  onChange={(e) => setFormOrder(Number(e.target.value))}
                  className="w-full bg-background border border-card-border rounded-xl p-3 focus:outline-none focus:border-gold-500 transition-colors"
                  placeholder="1, 2, 3..."
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground/70 mb-1 block">Tautan (URL)</label>
                <input 
                  type="url" 
                  required
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-xl p-3 focus:outline-none focus:border-gold-500 transition-colors"
                  placeholder="https://satsetwedeh.online/ampjb/"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-gold-500 text-black font-bold p-4 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold-600 transition-colors shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Master Confirm Modal */}
      {isMasterConfirmOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-card-bg border border-card-border w-full max-w-sm rounded-2xl p-6 relative shadow-2xl animate-in zoom-in-95">
             <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <Power className={`w-8 h-8 ${masterActionType === 'on' ? 'text-emerald-500' : 'text-red-500'}`} />
             </div>
             <h3 className="text-xl font-bold text-center mb-2">Konfirmasi Aksi</h3>
             <p className="text-center text-foreground/70 mb-6 text-sm">
                Apakah Anda yakin ingin <strong className={masterActionType === 'on' ? 'text-emerald-500' : 'text-red-500'}>{masterActionType === 'on' ? 'MENGHIDUPKAN' : 'MEMATIKAN'}</strong> semua tombol secara serentak? Tindakan ini langsung berefek pada sistem.
             </p>
             <div className="flex gap-3">
                <button onClick={() => setIsMasterConfirmOpen(false)} className="flex-1 px-4 py-3 bg-card-border rounded-xl font-bold hover:bg-card-border/80 transition-colors text-sm">Batal</button>
                <button onClick={executeMasterSwitch} className={`flex-1 px-4 py-3 text-white font-bold rounded-xl transition-colors text-sm ${masterActionType === 'on' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_4px_14px_0_rgba(16,185,129,0.39)]' : 'bg-red-500 hover:bg-red-600 shadow-[0_4px_14px_0_rgba(239,68,68,0.39)]'}`}>Ya, Lanjutkan</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
