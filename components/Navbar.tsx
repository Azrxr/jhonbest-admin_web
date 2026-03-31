"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, Shield, Link as LinkIcon, BarChart3, FileText } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "./AuthWrapper";

export function Navbar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Manajemen Tombol", href: "/buttons", icon: LinkIcon },
    { name: "Manajemen Admin", href: "/admins", icon: Shield },
    { name: "Privacy Policy", href: "/privacy-policy", icon: FileText },
  ];

  return (
    <nav className="glass-panel sticky top-0 z-50 rounded-b-xl mb-6 py-3 px-4 shadow-lg border-b border-card-border/50">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative overflow-hidden rounded-full w-10 h-10 border border-gold-500/30 group-hover:border-gold-500 transition-colors">
            <Image
              src="/ic_brand.png"
              alt="Jhonbest Gaming"
              fill
              priority
              className="object-cover"
            />
          </div>
          <span className="font-bold text-lg text-foreground tracking-tight">
            Jhonbest <span className="text-gold-500">Panel</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                  isActive ? "text-gold-500" : "text-foreground/70 hover:text-gold-500"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.name}
              </Link>
            );
          })}
          
          <div className="h-6 w-px bg-card-border mx-2" />
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-foreground/50 max-w-[120px] truncate">
              {user?.email}
            </span>
            <button
              onClick={logout}
              className="p-2 text-red-400 hover:bg-card-bg hover:text-red-300 rounded-lg transition-colors"
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-gold-500 focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-card-border flex flex-col gap-4 pb-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isActive ? "bg-card-bg text-gold-500 border border-gold-500/20" : "text-foreground hover:bg-card-bg/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-semibold">{link.name}</span>
              </Link>
            );
          })}
          <div className="mt-2 pt-4 border-t border-card-border flex justify-between items-center px-2">
			      <span className="text-sm text-foreground/60 truncate max-w-[200px]">{user?.email}</span>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm text-red-500 font-semibold px-4 py-2 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
