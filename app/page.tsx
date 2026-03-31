"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, writeBatch, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ShieldAlert, CheckCircle, XCircle, Gamepad2, Power, ExternalLink, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthWrapper";

export default function Dashboard() {
  const { user } = useAuth();
  const [totalButtons, setTotalButtons] = useState(0);
  const [activeButtons, setActiveButtons] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [buttonsList, setButtonsList] = useState<any[]>([]);
  const [isMasterConfirmOpen, setIsMasterConfirmOpen] = useState(false);
  const [masterActionType, setMasterActionType] = useState<"on" | "off" | null>(null);

  useEffect(() => {
    const unsubButtons = onSnapshot(query(collection(db, "buttons"), orderBy("order", "asc")), (snapshot) => {
      setTotalButtons(snapshot.size);
      const active = snapshot.docs.filter(doc => doc.data().isActive === true).length;
      setActiveButtons(active);
      const docsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setButtonsList(docsData);
    });

    const unsubAdmins = onSnapshot(collection(db, "admins"), (snapshot) => {
      setTotalAdmins(snapshot.size);
    });

    return () => {
      unsubButtons();
      unsubAdmins();
    };
  }, []);

  const openMasterConfirm = (action: "on" | "off") => {
    setMasterActionType(action);
    setIsMasterConfirmOpen(true);
  };

  const executeMasterSwitch = async () => {
    if (!masterActionType) return;
    const batch = writeBatch(db);
    buttonsList.forEach((btn) => {
      const ref = doc(db, "buttons", btn.id);
      batch.update(ref, { isActive: masterActionType === "on" });
    });
    await batch.commit();
    setIsMasterConfirmOpen(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Selamat Datang, <span className="text-gold-500">{user?.displayName || "Admin"}!</span>
          </h1>
          <p className="text-foreground/70">Ikhtisar status sistem panel admin Jhonbest Gaming.</p>
        </div>
        <div className="flex gap-3">
           <Link href="/buttons" className="flex items-center gap-2 px-4 py-2 bg-gold-500/20 text-gold-500 border border-gold-500/30 rounded-lg hover:bg-gold-500 hover:text-black transition-all font-semibold text-sm">
             <Plus className="w-4 h-4"/> Tombol Baru
           </Link>
           <Link href="/admins" className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-500 hover:text-white transition-all font-semibold text-sm">
             <Plus className="w-4 h-4"/> Admin Baru
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Admin Card */}
        <Link href="/admins" className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden group hover:border-indigo-500/50 transition-all cursor-pointer">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-colors" />
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-foreground/80 group-hover:text-indigo-400 transition-colors">Total Admin</h2>
            <div className="p-3 bg-card-border rounded-xl group-hover:bg-indigo-500/20 transition-colors">
              <ShieldAlert className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-5xl font-black text-foreground">{totalAdmins}</p>
            <ArrowRight className="w-5 h-5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Total Buttons Card */}
        <Link href="/buttons" className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden group hover:border-gold-500/50 transition-all cursor-pointer">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-gold-500/10 rounded-full blur-xl group-hover:bg-gold-500/20 transition-colors" />
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-foreground/80 group-hover:text-gold-500 transition-colors">Total Tombol</h2>
            <div className="p-3 bg-card-border rounded-xl group-hover:bg-gold-500/20 transition-colors">
              <Gamepad2 className="w-6 h-6 text-gold-500" />
            </div>
          </div>
           <div className="flex items-end justify-between">
            <p className="text-5xl font-black text-foreground">{totalButtons}</p>
            <ArrowRight className="w-5 h-5 text-gold-500 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Active Buttons Ratio */}
        <div className="glass-panel p-6 rounded-2xl flex justify-between items-center relative overflow-hidden group col-span-1 md:col-span-1">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors" />
          <div className="w-full">
            <h2 className="text-lg font-semibold text-foreground/80 mb-6">Status Tombol</h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium">Aktif</span>
                </div>
                <span className="font-bold">{activeButtons}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="font-medium">Mati</span>
                </div>
                <span className="font-bold">{totalButtons - activeButtons}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Saklar Utama Shortcut */}
        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-gold-500 flex flex-col justify-between h-full">
           <div>
              <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center mb-4 border border-gold-500/20">
                <Power className="w-6 h-6 text-gold-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Aksi Cepat: Saklar Utama</h2>
              <p className="text-foreground/70 text-sm mb-6">Pintasan untuk langsung menyalakan atau mematikan seluruh tombol Jhonbest secara serentak dari halaman depan.</p>
           </div>
           
           <div className="flex gap-3 mt-auto">
              <button 
                onClick={() => openMasterConfirm("on")}
                className="flex-1 py-3 px-2 bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 rounded-xl hover:bg-emerald-500 hover:text-white transition-all text-sm flex justify-center items-center gap-2"
              >
                <Power className="w-4 h-4"/> Nyalakan Semua
              </button>
              <button 
                onClick={() => openMasterConfirm("off")}
                className="flex-1 py-3 px-2 bg-red-500/20 text-red-500 font-bold border border-red-500/30 rounded-xl hover:bg-red-500 hover:text-white transition-all text-sm flex justify-center items-center gap-2"
              >
                <Power className="w-4 h-4"/> Matikan Semua
              </button>
           </div>
        </div>

        {/* Cuplikan Daftar Tombol (Top 3) */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col h-full">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-gold-500" /> Tombol Teratas
              </h2>
              <Link href="/buttons" className="text-sm font-semibold text-gold-500 hover:underline flex items-center gap-1">
                Lihat Semua <ArrowRight className="w-4 h-4" />
              </Link>
           </div>

           <div className="flex flex-col gap-3 flex-1">
              {buttonsList.length === 0 ? (
                 <p className="text-foreground/50 text-sm my-auto text-center">Belum ada tombol.</p>
              ) : (
                buttonsList.slice(0, 3).map((btn) => (
                   <div key={btn.id} className="flex items-center justify-between bg-card-bg/50 border border-card-border p-3 rounded-xl">
                      <div className="flex items-center gap-3 overflow-hidden">
                         <div className={`w-2 h-2 rounded-full shrink-0 ${btn.isActive ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
                         <span className="font-bold text-sm truncate">{btn.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                         <span className="text-xs text-foreground/50 font-mono hidden sm:inline-block max-w-[120px] truncate">{btn.url}</span>
                         <a href={btn.url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-card-border rounded-lg text-gold-500 hover:bg-gold-500/20 transition-colors">
                           <ExternalLink className="w-3.5 h-3.5" />
                         </a>
                      </div>
                   </div>
                ))
              )}
           </div>
        </div>
      </div>

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
                <button onClick={executeMasterSwitch} className={`flex-1 px-4 py-3 text-white font-bold rounded-xl transition-colors text-sm ${masterActionType === 'on' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>Ya, Lanjutkan</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
