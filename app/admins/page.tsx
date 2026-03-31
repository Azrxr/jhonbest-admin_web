"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Shield, Plus, X, Trash2, Pencil, UserCircle2, Clock } from "lucide-react";

export default function AdminsManagement() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [oldEmail, setOldEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "admins"), (snapshot) => {
      const docsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAdmins(docsData);
    });
    return () => unsubscribe();
  }, []);

  const openForm = (admin?: any) => {
    setFormError("");
    if (admin) {
      setIsEditMode(true);
      setOldEmail(admin.id);
      setFormEmail(admin.id);
      setFormName(admin.name || "");
    } else {
      setIsEditMode(false);
      setOldEmail("");
      setFormEmail("");
      setFormName("");
    }
    setIsFormOpen(true);
  };

  const deleteAdmin = async (id: string) => {
    if (confirm("Hapus admin ini? Akses mereka ke panel ini akan langsung terputus.")) {
      await deleteDoc(doc(db, "admins", id));
    }
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail || !formName) {
      setFormError("Nama dan Email wajib diisi.");
      return;
    }
    const cleanEmail = formEmail.trim().toLowerCase();

    setIsSaving(true);
    setFormError("");

    try {
      if (isEditMode) {
        // Jika edit email (berarti edit primary doc ID, kita harus delete & set baru, 
        // tapi kita batasi saja agar email tidak bisa diubah dengan mudah, atau kita update namanya saja)
        if (cleanEmail !== oldEmail) {
          // Buat doc baru
          await setDoc(doc(db, "admins", cleanEmail), {
            name: formName,
          });
          // Hapus doc lama
          await deleteDoc(doc(db, "admins", oldEmail));
        } else {
          // Hanya update nama
          await updateDoc(doc(db, "admins", cleanEmail), {
            name: formName,
          });
        }
      } else {
        // Mode tambah
        // Jika sudah ada, jangan ditimpa (meskipun setDoc bisa menimpa, tapi lebih baik cegah jika mau strict)
        // Disini kita setDoc saja
        await setDoc(doc(db, "admins", cleanEmail), {
          name: formName,
        });
      }
      setIsFormOpen(false);
    } catch (error: any) {
      setFormError("Gagal menyimpan data: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Belum pernah masuk";
    return new Date(dateString).toLocaleString("id-ID", {
      dateStyle: "medium", timeStyle: "short"
    });
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Manajemen Admin</h1>
          <p className="text-foreground/70">Daftar pengguna yang memiliki akses masuk ke Panel ini.</p>
        </div>
        
        <button 
          onClick={() => openForm()}
          className="w-full sm:w-auto px-4 py-3 bg-gold-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gold-600 transition-colors shadow-[0_0_15px_rgba(255,215,0,0.3)]"
        >
          <Plus className="w-5 h-5" /> Tambah Admin
        </button>
      </div>

      {/* Info Card */}
      <div className="mb-6 bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex gap-3 text-sm text-indigo-200">
        <Shield className="w-5 h-5 shrink-0 text-indigo-400 mt-0.5" />
        <p>Anda hanya perlu menambahkan Nama dan Email Google. Foto dan data login lainnya akan dilengkapi secara otomatis saat admin tersebut berhasil Masuk (Sign-In).</p>
      </div>

      {/* Grid of Admins */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {admins.length === 0 ? (
           <p className="text-foreground/50 py-8 col-span-full text-center border-2 border-dashed border-card-border rounded-2xl">Belum ada admin terdaftar.</p>
        ) : (
          admins.map((admin) => (
            <div key={admin.id} className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-gold-500/50 transition-colors relative group">
              
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full border-2 border-card-border overflow-hidden shrink-0 flex items-center justify-center bg-card-bg">
                  {admin.photoURL ? (
                    <img src={admin.photoURL} alt={admin.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle2 className="w-8 h-8 text-foreground/20" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight truncate max-w-[180px]" title={admin.name}>{admin.name || "Anonim"}</h3>
                  <p className="text-sm text-foreground/50 truncate max-w-[180px]" title={admin.id}>{admin.id}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 text-xs">
                <div className="flex items-center gap-2 text-foreground/60 bg-card-bg/50 p-2 rounded-lg">
                  <Clock className="w-4 h-4 text-gold-500" />
                  <span className="truncate flex-1">{formatDate(admin.lastLoginAt)}</span>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => openForm(admin)}
                    className="flex-1 bg-card-bg border border-card-border p-2 mt-2 rounded-lg text-sm font-semibold hover:bg-gold-500/10 hover:text-gold-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                  <button 
                    onClick={() => deleteAdmin(admin.id)}
                    className="px-3 bg-red-500/10 mt-2 border border-red-500/20 p-2 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Form Drawer / Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-card-bg sm:border border-card-border w-full max-w-sm rounded-t-3xl sm:rounded-2xl p-6 relative shadow-2xl animate-in slide-in-from-bottom-[50vh] sm:slide-in-from-bottom-10 sm:fade-in zoom-in-95">
            <button onClick={() => setIsFormOpen(false)} className="absolute top-6 right-6 text-foreground/50 hover:text-foreground bg-card-border/50 p-2 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-foreground">
              {isEditMode ? "Edit Admin" : "Tambah Admin"}
            </h2>

            {formError && (
              <div className="p-3 mb-6 border border-red-500/50 bg-red-500/10 text-red-500 text-sm rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveDoc} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground/70 mb-1 block">Nama Admin</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-xl p-3 focus:outline-none focus:border-gold-500 transition-colors"
                  placeholder="Budi Santoso"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground/70 mb-1 block">Email (Google)</label>
                <input 
                  type="email" 
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-xl p-3 focus:outline-none focus:border-gold-500 transition-colors"
                  placeholder="email@gmail.com"
                />
                <p className="text-xs text-foreground/50 mt-2">Pastikan email valid. Akses login akan dihubungkan ke email ini.</p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-gold-500 text-black font-bold p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gold-600 transition-colors shadow-lg shadow-gold-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Shield className="w-5 h-5" />
                  {isSaving ? "Menyimpan..." : "Simpan Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
