/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  BookOpen, 
  Bus, 
  Award, 
  ShieldCheck, 
  Zap, 
  Wifi, 
  Users, 
  Sparkles,
  CheckCircle2,
  MapPin,
  ArrowRight,
  Camera
} from 'lucide-react';
import { getSchoolPhotoSrc, onSchoolPhotosUpdated } from '../../../utils/photoManager';

interface FacilitiesPageProps {
  onNavigate: (page: string) => void;
}

export default function FacilitiesPage({ onNavigate }: FacilitiesPageProps) {
  const [, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const unsub = onSchoolPhotosUpdated(() => setUpdateTrigger(prev => prev + 1));
    return unsub;
  }, []);

  const scholarsImg = getSchoolPhotoSrc('IMG-20260918-WA0028.jpg');
  const assemblyImg = getSchoolPhotoSrc('IMG-20260918-WA0025.jpg');
  const classroomImg = getSchoolPhotoSrc('IMG-20260918-WA0027.jpg');

  return (
    <div className="space-y-12 pb-10" id="website-facilities-page">
      {/* Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl">
        <div className="max-w-3xl space-y-3">
          <span className="px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-bold">
            Campus Infrastructure in Kambia 1
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            World-Class Facilities for 21st Century Learning
          </h1>
          <p className="text-base text-slate-300 leading-relaxed font-normal">
            Located in Kambia 1, Northern Province, our school and college grounds combine modern digital learning environments, experimental science labs, and safe transit logistics.
          </p>
        </div>
      </section>

      {/* 1. SPOTLIGHT: SCHOLARS DELEGATION & CAMPUS LANDMARK */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 rounded-2xl overflow-hidden shadow-md border border-slate-100 relative bg-slate-900">
            <img 
              src={scholarsImg} 
              alt="Junior Secondary Scholars in ceremonial blazers with faculty at Givers World Mission in Kambia 1" 
              referrerPolicy="no-referrer"
              className="w-full h-80 sm:h-96 object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.opacity = '0.4';
              }}
            />
            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-slate-900/85 text-white text-xs font-black backdrop-blur-md flex items-center gap-1.5 border border-slate-700">
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kolenten Landmark & Secondary Scholars</span>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Discipline & Heritage</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              A Structured, Inspiring Environment for Leadership
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              Education at Givers World Mission Diplomats Academy is founded on high academic standards and moral discipline. Our campus grounds are structured to instill pride, unity, and Christian diplomatic stewardship in our pupils and students from their early years through college degrees.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 font-black text-slate-900 text-xs mb-1">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Uninterrupted Power</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Solar inverter and generator backup ensure uninterrupted day and evening study sessions.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 font-black text-slate-900 text-xs mb-1">
                  <Wifi className="w-4 h-4 text-blue-500" />
                  <span>Broadband Internet</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Campus internet for online academic research, WAEC syllabus exploration, and college projects.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 font-black text-slate-900 text-xs mb-1">
                  <Monitor className="w-4 h-4 text-emerald-600" />
                  <span>Practical ICT Lab</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Over 45 workstations with digital software, coding instruction, and typing training.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 font-black text-slate-900 text-xs mb-1">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>College Hall & Convocation</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Multi-purpose assembly hall for graduations, worship sermons, and music ministry.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SCIENCE LABS, LIBRARY, & TRANSPORT FLEET */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Science Labs */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900">
            Science Demonstration Labs
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Fully equipped with chemical reagents, biological specimens, optical microscopes, and circuit apparatus for hands-on WASSCE and BECE science practicals.
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Physics practical benches</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Chemistry titration stations</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Biology specimen models & dissection</span>
            </li>
          </ul>
        </div>

        {/* Library & Resource Center */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900">
            The Academy & College Library
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Quiet study haven containing over 5,000 curriculum textbooks, classic literature, past examination questions with solutions, and Christian reference volumes.
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>NPSE, BECE & WASSCE archive banks</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Digital library study stations</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Airy, naturally lit reading halls</span>
            </li>
          </ul>
        </div>

        {/* School Bus Fleet */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Bus className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900">
            Dedicated School Bus Fleet
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Four fleet buses safely transporting pupils and students across Kambia 1, Kambia 2, and border communities with experienced drivers and digital attendance tracking.
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Kambia 1 central corridor route</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Kambia 2 & surrounding township route</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Morning pick-up & afternoon drop-off</span>
            </li>
          </ul>
        </div>
      </section>

      {/* 3. CONVOCATION HALL & CLASSROOM EXAMINATION ENVIRONMENTS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="h-60 rounded-2xl overflow-hidden bg-slate-900">
            <img 
              src={assemblyImg} 
              alt="Assembly Hall Convocation with Orchestra Drums at Givers World Mission in Kambia 1" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.opacity = '0.4';
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-black text-slate-900">
              Assembly & Convocation Hall
            </h4>
            <span className="text-[10px] font-mono text-slate-400">IMG-20260918-WA0025.jpg</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Our multi-purpose campus auditorium accommodates over 1,000 guests for annual graduation commencement, Christian morning worship devotions, and music orchestra assemblies.
          </p>
        </div>

        <div className="rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="h-60 rounded-2xl overflow-hidden bg-slate-900">
            <img 
              src={classroomImg} 
              alt="Primary pupils seated in classroom writing tests at Givers World Mission in Kambia 1" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.opacity = '0.4';
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-black text-slate-900">
              Primary Examination Classrooms
            </h4>
            <span className="text-[10px] font-mono text-slate-400">IMG-20260918-WA0027.jpg</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Authentic classroom setting featuring dual-seat wooden desks, blackboard instruction, student coursework displays, and quiet examination conditions in Kambia 1.
          </p>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 text-center space-y-4">
        <h3 className="text-2xl font-black">
          Schedule a Campus Visit in Kambia 1
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          We welcome parents, guardians, and prospective college candidates to inspect our classrooms, library, and meet our faculty.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('contact')}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-colors cursor-pointer"
        >
          Contact Registrar for Campus Tour
        </button>
      </section>
    </div>
  );
}
