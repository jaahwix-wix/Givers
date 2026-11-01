/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  LogIn, 
  Phone, 
  Mail, 
  MapPin, 
  BellRing, 
  GraduationCap, 
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Camera,
  LayoutDashboard
} from 'lucide-react';
import schoolLogo from '../../assets/logo.jpg';
import { SCHOOL_INFO } from '../../initialData';
import PhotoSyncModal from './PhotoSyncModal';

interface WebsiteNavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onEnterMIS?: () => void;
  noticeCount?: number;
}

export default function WebsiteNavbar({ currentPage, onNavigate, onEnterMIS, noticeCount = 0 }: WebsiteNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPhotoSyncOpen, setIsPhotoSyncOpen] = useState(false);

  const NAV_ITEMS = [
    { id: 'home', label: 'Home' },
    { id: 'news', label: 'School News' },
    { id: 'gallery', label: 'Events Gallery' },
    { id: 'about', label: 'About & Leadership' },
    { id: 'academics', label: 'Academics & College' },
    { id: 'notices', label: 'Noticeboard & SMS', badge: noticeCount > 0 ? noticeCount : undefined },
    { id: 'facilities', label: 'Facilities' },
    { id: 'admissions', label: 'Admissions' },
    { id: 'contact', label: 'Contact & Map' },
  ];

  const handleNavClick = (pageId: string) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs" id="public-website-navbar">
      {/* Sierra Leone National Colors Accent Ribbon */}
      <div className="h-1.5 w-full flex">
        <div className="flex-1 bg-emerald-600" title="Green - Natural Wealth & Agriculture" />
        <div className="flex-1 bg-white border-y border-slate-200" title="White - Unity & Justice" />
        <div className="flex-1 bg-blue-600" title="Blue - Natural Harbour & Hope" />
      </div>

      {/* Top Notification & Hotline Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <MapPin className="w-3.5 h-3.5" />
              Kambia 1, Northern Province, Sierra Leone
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              Hotline: {SCHOOL_INFO.phone}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] sm:text-xs ml-auto">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-semibold">
              <ShieldCheck className="w-3 h-3" />
              MBSDSE & WAEC Center
            </span>
            <button
              type="button"
              onClick={() => handleNavClick('notices')}
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <BellRing className="w-3 h-3" />
              <span>SMS Dispatch Board</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand & Crest Logo */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 text-left group cursor-pointer"
          id="navbar-brand-logo-btn"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden p-0.5 bg-emerald-50 border-2 border-emerald-600 shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
            <img 
              src={schoolLogo} 
              alt="Givers World Mission Diplomats Academy Crest Logo" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight group-hover:text-emerald-700 transition-colors">
                GIVERS WORLD MISSION
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 uppercase tracking-wide">
              <span>Diplomats Academy & College</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-bold">Kambia 1</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Eagles Squad • Nursery, Primary, JSS, SSS & College
            </p>
          </div>
        </button>

        {/* Desktop Menu Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`relative px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  isActive
                    ? 'text-emerald-700 bg-emerald-50 font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.label}
                {item.badge && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-600 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right CTA: Dedicated Management Portal Access */}
        <div className="hidden lg:flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsPhotoSyncOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black text-xs transition-colors cursor-pointer border border-emerald-200"
            title="Replace AI-generated images with your authentic attached school photos"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-600" />
            <span>Replace Generated Photos</span>
          </button>

          {onEnterMIS && (
            <button
              type="button"
              onClick={onEnterMIS}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-indigo-950/20 transition-all hover:scale-[1.02] cursor-pointer"
              id="navbar-launch-mis-direct-btn"
              title="Launch the Full Management Information System (Admin Dashboard)"
            >
              <LayoutDashboard className="w-4 h-4 text-amber-300" />
              <span>Launch MIS</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleNavClick('login')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-sm transition-all hover:shadow-md cursor-pointer border border-slate-700/80"
            id="navbar-portal-login-btn"
          >
            <LogIn className="w-4 h-4 text-emerald-400" />
            <span>Portals</span>
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex xl:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPhotoSyncOpen(true)}
            className="p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="Photos"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-600" />
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('login')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-emerald-400" />
            <span>Portal</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-1 shadow-lg animate-fadeIn">
          <div className="pb-3 border-b border-slate-100 mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              School & College Navigation
            </span>
          </div>

          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold text-left transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-extrabold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-amber-400 text-slate-900 font-black">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>
            );
          })}

          <div className="pt-4 border-t border-slate-100 mt-3 space-y-2">
            {onEnterMIS && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onEnterMIS();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 text-white font-black text-sm shadow-md"
              >
                <LayoutDashboard className="w-4 h-4 text-amber-300" />
                <span>Launch MIS Dashboard</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleNavClick('login')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white font-black text-sm shadow-md"
            >
              <LogIn className="w-4 h-4 text-emerald-400" />
              <span>Enter Management Portals</span>
            </button>
          </div>
        </div>
      )}

      {/* Photo Sync & Real Photos Manager Modal */}
      <PhotoSyncModal 
        isOpen={isPhotoSyncOpen} 
        onClose={() => setIsPhotoSyncOpen(false)} 
      />
    </header>
  );
}
