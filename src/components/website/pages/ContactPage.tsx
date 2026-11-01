/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Navigation, 
  Bus,
  ShieldCheck,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { SCHOOL_INFO } from '../../../initialData';
import ContactSection from '../ContactSection';
import ScrollFadeIn from '../ScrollFadeIn';

export default function ContactPage() {
  return (
    <div className="space-y-12 pb-12" id="website-contact-page">
      {/* Banner */}
      <ScrollFadeIn direction="up">
        <section className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl">
          <div className="max-w-3xl space-y-3">
            <span className="px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-black uppercase tracking-wider">
              Campus Secretariat & Helpdesk
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Connect With Our Campus in Kambia 1
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Whether inquiring about pupil admission, college diploma matriculation, verification of examination records, or school bus stops, our administrative office in Kambia 1 is here to assist you.
            </p>
          </div>
        </section>
      </ScrollFadeIn>

      {/* Campus Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScrollFadeIn direction="up" delay={0.05}>
          <div className="h-full p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">Compound Physical Address</h3>
            <p className="text-xs text-slate-700 leading-relaxed font-bold">
              Givers World Mission Compound Kambia Town Sierra Leone.
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Landmark: Central Corridor, Kambia Town, Northern Province
            </p>
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn direction="up" delay={0.1}>
          <div className="h-full p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">Phone & SMS Inquiries</h3>
            <p className="text-sm font-black font-mono text-slate-900 leading-relaxed">
              <a href="tel:+23274155000" className="hover:text-blue-600 transition-colors">
                +232 74155000
              </a>
            </p>
            <p className="text-xs text-slate-600">
              Direct voice calls & SMS inquiries for Admissions, Bursary, and Principal's Secretariat.
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              Network coverage: Orange, Africell, and QCell
            </p>
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn direction="up" delay={0.15}>
          <div className="h-full p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">Operational Office Hours</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              <strong>Monday – Friday:</strong> 7:30 AM – 4:30 PM<br />
              <strong>Saturday (College Lectures):</strong> 8:00 AM – 2:00 PM<br />
              <strong>Sunday:</strong> Closed for Christian Worship
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              Campus gates open at 6:45 AM for pupil arrival
            </p>
          </div>
        </ScrollFadeIn>
      </div>

      {/* Primary Contact Form Section with Validation */}
      <ContactSection />

      {/* Transit & Driving Directions Section */}
      <ScrollFadeIn direction="up">
        <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                Directions & Transit Information
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                Visiting the Campus in Kambia 1
              </h3>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-bold">
              <Navigation className="w-4 h-4" />
              <span>Northern Province Route</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 leading-relaxed">
            <div className="space-y-3 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <h4 className="font-black text-white text-sm flex items-center gap-2">
                <Bus className="w-4 h-4 text-amber-400" />
                From Freetown or Makeni (Highway Access)
              </h4>
              <p>
                Take the primary Freetown–Conakry international highway heading north through Port Loko towards Kambia District. Upon entering Kambia 1 town center, turn right at the Court Bary junction onto Mission Road. The academy and college campus gates are located 350 meters ahead with prominent Eagles Squad signage.
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <h4 className="font-black text-white text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Visitor Registration & Security Protocols
              </h4>
              <p>
                All visiting parents, guardians, and education inspectors are required to sign in at the campus security checkpoint at Gate 1. Identification badges will be issued before proceeding to the administrative bursary or classroom corridors.
              </p>
            </div>
          </div>
        </section>
      </ScrollFadeIn>
    </div>
  );
}
