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
import SchoolCrestEmblem from '../SchoolCrestEmblem';
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

      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-4 flex flex-col items-center text-center">
            <SchoolCrestEmblem size="xl" className="w-48 h-48 sm:w-56 sm:h-56 shadow-2xl" />
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

      {/* Core Institutional Pillars & Values */}
      <section className="space-y-4">
        <div>
          <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
            Foundational Principles
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Core Pillars of the Eagles Squad
          </h2>
          <p className="text-xs text-slate-500">
            The philosophical benchmarks guiding holistic development at Givers World Mission Diplomats Academy & College
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-black text-sm text-slate-900">Christian Moral Integrity</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Devotional assemblies, ethical discipline, and God-fearing character formation for every young scholar.
            </p>
          </div>

          <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-black text-sm text-slate-900">National Exam Distinction</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Rigorous preparation for NPSE, BECE, and WASSCE with continuous mock trials and syllabus mastery.
            </p>
          </div>

          <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-black text-sm text-slate-900">Diplomatic & Civic Leadership</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Public speaking, debate competitions, community volunteering, and global awareness in Kambia 1.
            </p>
          </div>

          <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-black text-sm text-slate-900">College Career Pathways</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Accredited Higher National Diplomas and vocational certificates providing practical employment readiness.
            </p>
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
