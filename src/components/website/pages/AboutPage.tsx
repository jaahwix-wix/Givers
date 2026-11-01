/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShieldCheck, 
  Award, 
  BookOpen, 
  Cross, 
  Compass, 
  MapPin, 
  GraduationCap, 
  HeartHandshake, 
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import schoolLogo from '../../../assets/logo.jpg';
import { SCHOOL_INFO } from '../../../initialData';

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export default function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="space-y-12 pb-10" id="website-about-page">
      {/* Page Header Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-bold">
            <MapPin className="w-3.5 h-3.5" />
            <span>Kambia Town, Sierra Leone</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            About Givers World Mission Diplomats Academy & College
          </h1>
          <p className="text-base text-slate-300 font-normal leading-relaxed">
            Home of the <strong>Eagles Squad</strong> — Pioneering excellence in Christian pedagogy, academic rigor, moral integrity, and community empowerment in Kambia 1 since 2000.
          </p>
        </div>
      </section>

      {/* Official Crest & Coat of Arms Explanation */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-4 flex flex-col items-center text-center">
            <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-3xl p-3 bg-emerald-50/50 border-4 border-emerald-600 shadow-xl overflow-hidden flex items-center justify-center">
              <img 
                src={schoolLogo} 
                alt="Official School Crest of Givers World Mission Diplomats Academy Kambia"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="mt-4 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs">
              Official Heraldic Crest
            </span>
            <p className="text-xs text-slate-500 font-bold mt-1">
              Registered with MBSDSE Sierra Leone
            </p>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Symbolism of the School Emblem</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              The Meaning of the G.W.D.A Eagles Squad Crest
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every detail in our official coat of arms reflects the core divine mission and educational philosophy given to our founder, <strong>Evangelist Saint Turay</strong>:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm mb-1">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">1</span>
                  <span>The Soaring Eagle</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Inspired by Isaiah 40:31: <em>"They shall mount up with wings like eagles."</em> It signifies courage, visionary foresight, and rising above life's obstacles to academic victory.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm mb-1">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">2</span>
                  <span>The Latin Christian Cross</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Represents our foundational Christian faith, Christ-centered values, salvation, humility, and sacrificial love for society.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm mb-1">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">3</span>
                  <span>The Open Holy Bible</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Signifies the written Word of God as the ultimate foundation of truth, wisdom, moral instruction, and enlightenment.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm mb-1">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">4</span>
                  <span>"EAGLES SQUAD" Ribbon</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The official brotherhood and sisterhood of students, alumni, and scholars committed to diplomatic representation and leadership.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Profile: Evangelist Saint Turay */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-lg">
        <div className="max-w-4xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                Founder & Executive Head
              </span>
              <h3 className="text-2xl font-black text-white">
                Evangelist Saint Turay
              </h3>
              <p className="text-xs text-slate-400">
                CEO, Co-Founder & Principal
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
            <p>
              <strong>Evangelist Saint Turay</strong> founded Givers World Mission Diplomats Academy with a passionate divine mandate: to bring world-class, affordable, and morally rooted education to Kambia and the entire Northern Province of Sierra Leone. 
            </p>
            <p>
              Under his visionary stewardship, the institution has grown from a humble community tutoring initiative into an accredited academic citadel comprising Nursery, Primary (NPSE), Junior Secondary (BECE), Senior Secondary (WASSCE Arts, Science, Commerce), and a full-fledged Tertiary College Division in Kambia 1.
            </p>
            <blockquote className="p-4 rounded-2xl bg-slate-800/80 border-l-4 border-amber-400 text-slate-200 italic">
              "We do not merely teach students to pass exams; we train diplomats of Christ and leaders of Sierra Leone who are armed with both the Bible and the computer keyboard."
            </blockquote>
          </div>
        </div>
      </section>

      {/* Vision, Mission, & Core Values */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-900">Our Vision</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            To be Sierra Leone's premier Christian educational center in the Northern Province, recognized internationally for producing scholars of intellectual distinction, ethical steadfastness, and technological capability.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-900">Our Mission</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            To provide comprehensive, accessible, and high-quality education in Kambia 1 from early childhood through college diplomas, fostering spiritual discipline, digital competence, and entrepreneurial leadership.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-900">Core Values</h3>
          <ul className="text-xs text-slate-600 space-y-1.5">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span><strong>Faith in God:</strong> Spiritual devotions & prayers</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span><strong>Excellence:</strong> 100% pass rate in national exams</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span><strong>Integrity:</strong> Honest exams & conduct</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span><strong>Service:</strong> Uplifting the Kambia 1 community</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Authentic Campus & Student Life Photo Showcase */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
              Authentic Campus Life in Kambia 1
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Pupils, Scholars & Convocation Gallery
            </h2>
            <p className="text-xs text-slate-500">
              Photographic archives of daily academic life and graduation commencements at G.W.D.A
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('gallery')}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>View All 10 Photos in Gallery</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs group">
            <div className="relative aspect-[4/3] overflow-hidden">
              <img 
                src="/school-photos/IMG-20260918-WA0028.jpg" 
                alt="Junior Secondary Scholars in official blazer uniforms" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
                <span className="text-xs font-black text-white">Secondary Scholars in Blazers</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs group">
            <div className="relative aspect-[4/3] overflow-hidden">
              <img 
                src="/school-photos/IMG-20260918-WA0027.jpg" 
                alt="Primary pupils seated at desks writing exam in classroom" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
                <span className="text-xs font-black text-white">Classroom Exam in Kambia 1</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs group">
            <div className="relative aspect-[4/3] overflow-hidden">
              <img 
                src="/school-photos/IMG-20260918-WA0020.jpg" 
                alt="Commencement ceremony graduation lineup" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
                <span className="text-xs font-black text-white">Commencement Graduation</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs group">
            <div className="relative aspect-[4/3] overflow-hidden">
              <img 
                src="/school-photos/IMG-20260918-WA0022.jpg" 
                alt="College Division female scholars in emerald green academic robes" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
                <span className="text-xs font-black text-white">College Division Diplomats</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location in Kambia Town & Compound Physical Address */}
      <section className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-600 text-white">
              <MapPin className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-black text-slate-900">
              Compound Physical Address
            </h3>
          </div>
          <p className="text-sm font-bold text-slate-900">
            Givers World Mission Compound Kambia Town Sierra Leone.
          </p>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Situated strategically along the central corridor in Kambia Town, our campus features multi-story modern academic halls, dedicated ICT lab, science workshops, and school bus routes.
          </p>
          <div className="pt-1 flex flex-wrap items-center gap-3 text-xs text-slate-700">
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-900 bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-200">
              <span className="font-bold">Phone & SMS Inquiries:</span>
              <a href="tel:+23274155000" className="font-mono font-black text-emerald-800 hover:underline">+232 74155000</a>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('contact')}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-colors flex items-center gap-2 cursor-pointer flex-shrink-0"
        >
          <span>Find Campus on Map</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
}
