/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  GraduationCap, 
  BookOpen, 
  ArrowRight,
  ShieldCheck,
  MapPin,
  Award,
  Users,
  LayoutDashboard,
  Monitor,
  Bus,
  CheckCircle2,
  Calendar,
  Phone
} from 'lucide-react';
import SchoolCrestEmblem from './SchoolCrestEmblem';
import { SCHOOL_INFO } from '../../initialData';

interface HeroSlide {
  id: string;
  tagline: string;
  category: string;
  title: string;
  description: string;
  icon: any;
  ctaText: string;
  ctaAction: string;
  statBadge: { value: string; label: string };
  highlights: string[];
}

const HERO_PILLARS: HeroSlide[] = [
  {
    id: 'academics',
    tagline: 'Home of the Eagles Squad • Kambia 1',
    category: 'Academic Excellence',
    title: 'Raising Christian Leaders, Academic Giants & Diplomats',
    description: 'Accredited by MBSDSE Sierra Leone from Nursery and Primary through Junior Secondary (JSS), Senior Secondary (SSS), and College Higher Diploma programs in Kambia 1.',
    icon: GraduationCap,
    ctaText: 'Explore Academic Programs',
    ctaAction: 'academics',
    statBadge: { value: '100%', label: 'Pass Rate at NPSE & BECE' },
    highlights: ['Continuous Terminal Assessments', 'WAEC Accredited Examination Center', 'Expert Specialized Faculty']
  },
  {
    id: 'pedagogy',
    tagline: 'Faith, Morals & Discipline',
    category: 'Christian Pedagogy',
    title: 'Nurturing Moral Integrity & Spiritual Grounding',
    description: 'Every pupil and student is grounded in Christian devotional virtues, civic responsibility, and servant leadership, preparing graduates to excel with honor in higher education and public life.',
    icon: BookOpen,
    ctaText: 'About Our Heritage',
    ctaAction: 'about',
    statBadge: { value: '25+ Yrs', label: 'Dedicated Community Service' },
    highlights: ['Morning Devotional Assemblies', 'Strict Character Mentorship', 'Zero Tolerance for Malpractice']
  },
  {
    id: 'technology',
    tagline: 'Digital Skills for 21st Century',
    category: 'STEM & Computer Laboratories',
    title: 'Modern Digital Literacy & Experimental Science',
    description: 'Equipped with computer workstations, digital literacy training, and practical biology and chemistry laboratory stations to give our youth a competitive advantage.',
    icon: Monitor,
    ctaText: 'View Campus Facilities',
    ctaAction: 'facilities',
    statBadge: { value: '30+ Stn', label: 'Computer Lab Workstations' },
    highlights: ['Interactive Typing & IT Training', 'Integrated Science Experiment Kits', 'Safe Power & Backup Generators']
  },
  {
    id: 'transport',
    tagline: 'Punctual & Supervised Student Logistics',
    category: 'School Bus Fleet',
    title: 'Safe Daily Commute Across Kambia District',
    description: 'Four dedicated school buses safely transport pupils and students daily across Kambia 1, Kambia 2, and neighbouring communities with monitored adult supervision.',
    icon: Bus,
    ctaText: 'Inquire About Bus Routes',
    ctaAction: 'contact',
    statBadge: { value: '4 Buses', label: 'Dedicated Fleet Vehicles' },
    highlights: ['Morning & Afternoon Pickup', 'Driver Background Verification', 'Seatbelts & First-Aid Onboard']
  }
];

interface HomeSlideshowProps {
  onNavigate: (page: string, args?: any) => void;
}

export default function HomeSlideshow({ onNavigate }: HomeSlideshowProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % HERO_PILLARS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const currentPillar = HERO_PILLARS[currentIdx];
  const IconComponent = currentPillar.icon;

  return (
    <div 
      className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      id="hero-slideshow-container"
    >
      {/* Decorative ambient background gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-6 sm:p-10 md:p-14">
        {/* Top Indicators Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <SchoolCrestEmblem size="md" />
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 block">
                Official Web Portal
              </span>
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight">
                Givers World Mission Diplomats Academy & College
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-700/60">
              <MapPin className="w-3.5 h-3.5" />
              Kambia 1, Northern Province
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Eagles Squad
            </span>
          </div>
        </div>

        {/* Dynamic Pillar Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPillar.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
          >
            {/* Left Column: Heading, Description & CTAs */}
            <div className="lg:col-span-8 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-emerald-600 text-white shadow-md">
                  <IconComponent className="w-3.5 h-3.5" />
                  {currentPillar.category}
                </span>
                <span className="text-xs font-bold text-amber-300">
                  {currentPillar.tagline}
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
                {currentPillar.title}
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-2xl">
                {currentPillar.description}
              </p>

              {/* Bullet highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                {currentPillar.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-emerald-200 bg-white/5 p-2 rounded-xl border border-white/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="pt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate(currentPillar.ctaAction)}
                  className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition-all transform hover:-translate-y-0.5 shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <span>{currentPillar.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('admissions')}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-colors cursor-pointer"
                >
                  2026/2027 Admissions
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('notices')}
                  className="px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-amber-300 font-bold text-xs sm:text-sm border border-amber-400/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Class SMS Board</span>
                </button>
              </div>
            </div>

            {/* Right Column: Institutional Metric & Quick Navigation */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-6 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-center space-y-2 shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto shadow-md">
                  <IconComponent className="w-6 h-6" />
                </div>
                <div className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight">
                  {currentPillar.statBadge.value}
                </div>
                <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {currentPillar.statBadge.label}
                </p>
                <p className="text-[11px] text-slate-300">
                  Northern Province, Sierra Leone
                </p>
              </div>

              {/* Direct Secretariat Contact */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <span>Campus Secretariat</span>
                  <span className="text-emerald-400">Open 7:30 AM - 4:30 PM</span>
                </div>
                <div className="flex items-center gap-2 text-white font-mono font-bold">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>{SCHOOL_INFO.phone}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom Switcher Tabs */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {HERO_PILLARS.map((pillar, idx) => (
              <button
                key={pillar.id}
                type="button"
                onClick={() => setCurrentIdx(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentIdx === idx
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black scale-105'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                <span>{pillar.category}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setCurrentIdx((prev) => (prev - 1 + HERO_PILLARS.length) % HERO_PILLARS.length)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Previous pillar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentIdx((prev) => (prev + 1) % HERO_PILLARS.length)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Next pillar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
