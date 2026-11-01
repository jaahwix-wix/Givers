/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  GraduationCap, 
  ShieldCheck, 
  ChevronRight, 
  Globe, 
  Clock, 
  BookOpen, 
  Award,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  MessageCircle,
  ExternalLink,
  Heart
} from 'lucide-react';
import schoolLogo from '../../assets/logo.jpg';
import { SCHOOL_INFO } from '../../initialData';

interface WebsiteFooterProps {
  onNavigate: (page: string) => void;
}

export default function WebsiteFooter({ onNavigate }: WebsiteFooterProps) {
  const currentYear = new Date().getFullYear();

  const handleLink = (page: string) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socialLinks = [
    {
      name: 'Facebook',
      url: 'https://facebook.com/giversworldmission',
      icon: Facebook,
      color: 'hover:bg-blue-600 hover:text-white',
      ariaLabel: 'Official Facebook Page of Givers World Mission'
    },
    {
      name: 'WhatsApp Direct',
      url: 'https://wa.me/23276123456',
      icon: MessageCircle,
      color: 'hover:bg-emerald-600 hover:text-white',
      ariaLabel: 'WhatsApp Student & Parent Enquiries'
    },
    {
      name: 'YouTube Channel',
      url: 'https://youtube.com/@giversworldmission',
      icon: Youtube,
      color: 'hover:bg-red-600 hover:text-white',
      ariaLabel: 'YouTube Convocation & Chapel Devotions'
    },
    {
      name: 'Twitter / X',
      url: 'https://twitter.com/gwmission_sl',
      icon: Twitter,
      color: 'hover:bg-sky-500 hover:text-white',
      ariaLabel: 'Follow on Twitter / X'
    },
    {
      name: 'LinkedIn Academic Network',
      url: 'https://linkedin.com/school/giversworldmission',
      icon: Linkedin,
      color: 'hover:bg-blue-700 hover:text-white',
      ariaLabel: 'Connect on LinkedIn'
    }
  ];

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 font-sans" id="public-website-footer">
      {/* Sierra Leone National Colors Stripe (Green, White, Blue) */}
      <div className="h-1.5 w-full flex">
        <div className="flex-1 bg-emerald-600" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-blue-600" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Column 1: School Identity & Physical Address */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl overflow-hidden p-1 bg-white border border-emerald-500 shadow-md flex-shrink-0">
                <img 
                  src={schoolLogo} 
                  alt="Givers World Mission Diplomats Academy & College Crest" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-white font-black text-base tracking-tight leading-tight">
                  GIVERS WORLD MISSION
                </h3>
                <p className="text-emerald-400 font-extrabold text-xs">
                  Diplomats Academy & College
                </p>
                <p className="text-amber-400 font-bold text-[11px]">
                  Eagles Squad • Kambia 1
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Empowering Sierra Leonean youth through academic excellence, moral discipline, and 21st-century technological education in Kambia District.
            </p>

            {/* Physical Address Block */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>Compound Physical Address</span>
              </div>
              <p className="text-slate-300 font-bold leading-relaxed">
                Givers World Mission Compound Kambia Town Sierra Leone.
              </p>
            </div>

            {/* Accreditation Badges */}
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-[11px] font-bold inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                MBSSE Accredited
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 text-[11px] font-semibold inline-flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                WAEC Center #00412
              </span>
            </div>
          </div>

          {/* Column 2: Official Contact Numbers & Hours */}
          <div className="space-y-4">
            <h4 className="text-white font-black text-sm uppercase tracking-wider border-l-2 border-emerald-500 pl-2.5">
              Contact Numbers & Hours
            </h4>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] text-slate-400 block font-bold uppercase tracking-wider">
                      Phone & SMS Inquiries:
                    </span>
                    <a 
                      href="tel:+23274155000" 
                      className="text-white font-mono font-bold hover:text-emerald-400 transition-colors block text-sm mt-0.5"
                    >
                      +232 74155000
                    </a>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-start gap-2.5">
                  <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] text-slate-400 block font-bold uppercase tracking-wider">
                      WhatsApp & SMS:
                    </span>
                    <a 
                      href="https://wa.me/23274155000" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-emerald-400 font-mono font-bold hover:underline"
                    >
                      +232 74155000
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                    Official Email:
                  </span>
                </div>
                <a 
                  href={`mailto:${SCHOOL_INFO.email}`}
                  className="text-slate-200 font-mono hover:text-emerald-400 transition-colors block truncate"
                >
                  {SCHOOL_INFO.email}
                </a>
              </div>

              <div className="flex items-start gap-2 pt-1 text-slate-400 text-xs">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Office Hours:</strong> Mon – Fri: 7:30 AM – 4:30 PM<br />
                  Saturday (College): 8:00 AM – 2:00 PM
                </span>
              </div>
            </div>
          </div>

          {/* Column 3: Academic Divisions & Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-black text-sm uppercase tracking-wider border-l-2 border-emerald-500 pl-2.5">
              Academics & Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  type="button" 
                  onClick={() => handleLink('home')}
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-500" />
                  Public Landing & Slideshow
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => handleLink('academics')}
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-500" />
                  Nursery & Primary (NPSE Center)
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => handleLink('academics')}
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-500" />
                  JSS & SSS Academy (BECE & WASSCE)
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => handleLink('academics')}
                  className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3 text-amber-400" />
                  College Higher Diplomas & IT Degrees
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => handleLink('facilities')}
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-500" />
                  Modern Computer Lab & Science Labs
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => handleLink('admissions')}
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-500" />
                  2026/2027 Admissions Enrollment
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => handleLink('contact')}
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3 text-emerald-500" />
                  Contact Administration & Send Inquiry
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Social Media Channels & Connect */}
          <div className="space-y-4">
            <h4 className="text-white font-black text-sm uppercase tracking-wider border-l-2 border-emerald-500 pl-2.5">
              Follow & Connect
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Stay connected with school assemblies, graduation recaps, sports updates, and student milestones across our official social channels:
            </p>

            {/* Social Media Links Grid */}
            <div className="flex flex-wrap items-center gap-2 pt-1" id="footer-social-links">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.ariaLabel}
                    className={`w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center transition-all ${social.color} shadow-xs`}
                    title={social.name}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>

            {/* Fast Inquiry Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleLink('contact')}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <span>Send Direct Inquiry to Kambia 1</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Copyright, Leadership & Mission */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            © {currentYear} Givers World Mission Diplomats Academy & College (Eagles Squad), Kambia 1, Sierra Leone. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-slate-400">
            <span>Founded by <strong>{SCHOOL_INFO.principalName}</strong></span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">Excellence in Christian Education</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
