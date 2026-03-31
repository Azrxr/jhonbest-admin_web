"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Database, ShieldAlert, CheckCircle, XCircle, Gamepad2 } from "lucide-react";

export default function Dashboard() {
  const [totalButtons, setTotalButtons] = useState(0);
  const [activeButtons, setActiveButtons] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);

  useEffect(() => {
    // Listen to buttons
    const unsubscribeButtons = onSnapshot(collection(db, "buttons"), (snapshot) => {
      setTotalButtons(snapshot.size);
      const active = snapshot.docs.filter(doc => doc.data().isActive === true).length;
      setActiveButtons(active);
    });

    // Listen to admins
    const unsubscribeAdmins = onSnapshot(collection(db, "admins"), (snapshot) => {
      setTotalAdmins(snapshot.size);
    });

    return () => {
      unsubscribeButtons();
      unsubscribeAdmins();
    };
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Dashboard <span className="text-gold-500">Ringkasan</span>
        </h1>
        <p className="text-foreground/70">Ikhtisar status sistem panel admin Jhonbest Gaming.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Admin Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-gold-500/10 rounded-full blur-xl group-hover:bg-gold-500/20 transition-colors" />
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-foreground/80">Total Admin</h2>
            <div className="p-3 bg-card-border rounded-xl">
              <ShieldAlert className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <p className="text-5xl font-black text-foreground">{totalAdmins}</p>
        </div>

        {/* Total Buttons Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-gold-500/10 rounded-full blur-xl group-hover:bg-gold-500/20 transition-colors" />
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-foreground/80">Total Tombol</h2>
            <div className="p-3 bg-card-border rounded-xl">
              <Gamepad2 className="w-6 h-6 text-gold-500" />
            </div>
          </div>
          <p className="text-5xl font-black text-foreground">{totalButtons}</p>
        </div>

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
    </div>
  );
}
