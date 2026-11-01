/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Monitor, 
  Bus, 
  Award, 
  ShieldCheck, 
  BellRing, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Sparkles, 
  Calendar,
  Smartphone,
  ChevronRight,
  MapPin,
  FileText,
  LayoutDashboard
} from 'lucide-react';
import HomeSlideshow from '../HomeSlideshow';
import { SCHOOL_INFO } from '../../../initialData';
import { ClassNotice } from '../../../types';
import schoolLogo from '../../../assets/logo.jpg';
import ScrollFadeIn from '../ScrollFadeIn';
import SchoolNewsSection from '../SchoolNewsSection';
import EventsGallery from '../EventsGallery';
import ContactSection from '../ContactSection';

interface HomePageProps {
  onNavigate: (page: string, args?: any) => void;
  notices: ClassNotice[];
}

export default function HomePage({ onNavigate, notices }: HomePageProps) {
  const latestNotices = notices.slice(0, 3);

  return (
    <div className="space-y-16 pb-12" id="website-home-page">
      {/* 1. HERO SLIDESHOW OF PUPILS & STUDENTS, CLASSROOM, & COMPUTER LAB */}
      <section className="relative" id="hero-slideshow-section">
        <HomeSlideshow onNavigate={onNavigate} />
      </section>

      {/* 2. MANAGEMENT INFORMATION SYSTEM (MIS) DIRECT ACCESS BANNER */}
      <ScrollFadeIn direction="up">
        <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-indigo-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6" id="mis-direct-banner">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-slate-950 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Live Active System
              </span>
              <span className="text-xs font-bold text-amber-300">
                School Management Information System (MIS)
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Access Student Records, Academic Scores & Institutional Controls
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Official information system for Givers World Mission Diplomats Academy & College: Continuous Assessments, WAEC Preps, Tuition Bursary, Fleet Bus Logistics, and Staff Directory.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => onNavigate('mis')}
              className="flex-1 lg:flex-none px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] cursor-pointer"
              id="home-launch-mis-btn"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Enter MIS Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <span>Choose Role</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </section>
      </ScrollFadeIn>

      {/* 3. LIVE ANNOUNCEMENTS & SMS DISPATCH TICKER */}
      <ScrollFadeIn direction="up">
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-xs" id="live-notices-ticker">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-amber-400 text-slate-950 flex-shrink-0 shadow-xs">
                <BellRing className="w-5 h-5 animate-bounce" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-900 uppercase tracking-wide">
                    Latest School & College Notice
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white flex items-center gap-1">
                    <Smartphone className="w-2.5 h-2.5" />
                    Live SMS Dispatched
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {latestNotices[0]?.title || "Welcome to the 2026/2027 Academic Session at Kambia 1"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                type="button"
                onClick={() => onNavigate('notices')}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>View All Notices</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      </ScrollFadeIn>

      {/* 3. FOUR CORE PILLARS / HIGHLIGHTS */}
      <section className="space-y-4" id="academic-pillars-section">
        <ScrollFadeIn direction="up">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
              Educational Excellence in Kambia 1
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Comprehensive Pathways to Success
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              From early childhood development to accredited university college diplomas under Christian mentorship.
            </p>
          </div>
        </ScrollFadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ScrollFadeIn direction="up" delay={0.05}>
            <div 
              onClick={() => onNavigate('academics')}
              className="h-full p-6 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-900 mb-1 group-hover:text-emerald-700 transition-colors">
                  Academics & College
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Nursery 1-3, Primary 1-6 (NPSE prep), JSS 1-3 (BECE), SSS 1-3 (WASSCE Arts, Sciences, Commerce) to Higher Diploma College degrees.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs font-extrabold text-emerald-700">
                <span>Explore Academics</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </ScrollFadeIn>

          <ScrollFadeIn direction="up" delay={0.1}>
            <div 
              onClick={() => onNavigate('facilities')}
              className="h-full p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Monitor className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">
                  Modern Computer Lab
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  45+ workstations, dedicated solar power storage, high-speed connectivity, and coding fundamentals from Primary 4 upwards.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs font-extrabold text-blue-700">
                <span>Tour ICT Lab</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </ScrollFadeIn>

          <ScrollFadeIn direction="up" delay={0.15}>
            <div 
              onClick={() => onNavigate('notices')}
              className="h-full p-6 rounded-2xl bg-white border border-slate-200 hover:border-amber-500 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-900 mb-1 group-hover:text-amber-700 transition-colors">
                  Class SMS Broadcasting
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Instant mobile SMS notifications over Orange, Africell, and QCell keep parents continuously updated on test scores and closures.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs font-extrabold text-amber-700">
                <span>View Notices</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </ScrollFadeIn>

          <ScrollFadeIn direction="up" delay={0.2}>
            <div 
              onClick={() => onNavigate('facilities')}
              className="h-full p-6 rounded-2xl bg-white border border-slate-200 hover:border-purple-500 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Bus className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-900 mb-1 group-hover:text-purple-700 transition-colors">
                  Safe School Bus Fleet
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Dedicated school transport covering Kambia 1, Kambia 2, and border communities with morning and afternoon driver supervision.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs font-extrabold text-purple-700">
                <span>Transport Routes</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </ScrollFadeIn>
        </div>
      </section>

      {/* 4. PRINCIPAL'S WELCOME & FOUNDER PROFILE */}
      <ScrollFadeIn direction="up">
        <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl" id="principal-welcome-section">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4 flex flex-col items-center text-center">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl p-1 bg-white border-4 border-emerald-500 shadow-2xl overflow-hidden mb-4">
                <img 
                  src={schoolLogo} 
                  alt="Givers World Mission Crest Logo" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
              <h4 className="text-lg font-black text-white">
                {SCHOOL_INFO.principalName}
              </h4>
              <p className="text-emerald-400 font-extrabold text-xs">
                Founder, CEO & Principal
              </p>
              <p className="text-slate-400 text-[11px] mt-1">
                Givers World Mission Diplomats Academy & College
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-700 text-xs text-emerald-300 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Eagles Squad Leadership</span>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Message from the CEO & Principal</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                "Raising Christian Leaders, Academic Giants, and World-Class Diplomats in Kambia 1"
              </h3>

              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                Welcome to the official web portal of Givers World Mission Diplomats Academy & College. Situated proudly in Kambia 1, Northern Province, Sierra Leone, our mission is to empower every boy and girl through holistic academic training, spiritual grounding in God's Holy Word, and cutting-edge technological readiness.
              </p>

              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                Whether your child is entering our vibrant Nursery program, preparing for the National Primary School Examination (NPSE), sitting the BECE or WASSCE in our accredited exam centers, or pursuing tertiary qualifications in our College Division, they will soar as part of the Eagles Squad!
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-colors flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <span>Read Full Academy History</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('admissions')}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-colors cursor-pointer"
                >
                  Enroll Your Child for 2026/2027
                </button>
              </div>
            </div>
          </div>
        </section>
      </ScrollFadeIn>

      {/* 5. SCHOOL NEWS & RECENT ANNOUNCEMENTS SECTION (NO LOGIN REQUIRED) */}
      <SchoolNewsSection />

      {/* 6. EVENTS GALLERY: RESPONSIVE MASONRY GRID OF CAMPUS LIFE */}
      <EventsGallery />

      {/* 7. KEY METRICS OF EXCELLENCE */}
      <ScrollFadeIn direction="up">
        <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs" id="school-metrics-section">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-700 tracking-tight">
                1,450+
              </div>
              <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wide">
                Pupils & Students
              </p>
              <p className="text-[11px] text-slate-400">Nursery to College in Kambia 1</p>
            </div>

            <div>
              <div className="text-3xl sm:text-4xl font-black text-blue-700 tracking-tight">
                100%
              </div>
              <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wide">
                Exam Pass Rate
              </p>
              <p className="text-[11px] text-slate-400">NPSE & BECE Distinctions</p>
            </div>

            <div>
              <div className="text-3xl sm:text-4xl font-black text-purple-700 tracking-tight">
                32+
              </div>
              <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wide">
                Modern Classrooms
              </p>
              <p className="text-[11px] text-slate-400">Ventilated & Fully Equipped</p>
            </div>

            <div>
              <div className="text-3xl sm:text-4xl font-black text-amber-600 tracking-tight">
                4
              </div>
              <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wide">
                Dedicated Buses
              </p>
              <p className="text-[11px] text-slate-400">Safe Daily Student Commute</p>
            </div>
          </div>
        </section>
      </ScrollFadeIn>

      {/* 8. CONTACT US SECTION WITH VALIDATION */}
      <ContactSection />

      {/* 9. ADMISSIONS CALL TO ACTION */}
      <ScrollFadeIn direction="up">
        <section className="bg-emerald-800 text-white rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-xl" id="cta-admissions-banner">
          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <span className="px-3 py-1 rounded-full bg-emerald-900/80 text-emerald-200 text-xs font-black uppercase tracking-wider border border-emerald-700">
              Admissions Open • 2026/2027 Academic Year
            </span>
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Give Your Child the Foundation to Soar with the Eagles Squad
            </h3>
            <p className="text-sm sm:text-base text-emerald-100 font-normal leading-relaxed">
              Enroll today at Givers World Mission Diplomats Academy & College in Kambia 1, Northern Province, Sierra Leone. Inquiries and admissions are processed directly at the campus secretariat.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate('admissions')}
                className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-lg transition-all cursor-pointer"
              >
                Apply Online Now
              </button>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="px-6 py-3 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white font-bold text-sm border border-emerald-700 transition-colors cursor-pointer"
              >
                Directions & Contact Details
              </button>
            </div>
          </div>
        </section>
      </ScrollFadeIn>
    </div>
  );
}
