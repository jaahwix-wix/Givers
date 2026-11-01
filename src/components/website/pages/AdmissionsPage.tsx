/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Send, 
  Download, 
  Clock, 
  Calendar, 
  CreditCard, 
  Sparkles, 
  HelpCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { SCHOOL_INFO } from '../../../initialData';

export default function AdmissionsPage() {
  // Form State
  const [studentName, setStudentName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [targetClass, setTargetClass] = useState('SSS 1 (Science)');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentAddress, setParentAddress] = useState('Kambia 1, Sierra Leone');
  const [previousSchool, setPreviousSchool] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !parentPhone.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const appRef = `GWDA-ADM-${Math.floor(100000 + Math.random() * 900000)}`;
      setApplicationSuccess(appRef);
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div className="space-y-12 pb-10" id="website-admissions-page">
      {/* Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl">
        <div className="max-w-3xl space-y-3">
          <span className="px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-bold">
            Admissions Office • Kambia 1 Campus
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Admissions for 2026/2027 Academic Session
          </h1>
          <p className="text-base text-slate-300 leading-relaxed font-normal">
            Applications are actively open for Nursery 1-3, Primary 1-6, JSS 1-3, SSS 1-3 (Science, Arts, Commerce), and Tertiary College Higher Diploma programs.
          </p>
        </div>
      </section>

      {/* 4 Steps to Enrolling */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <h2 className="text-xl font-black text-slate-900 mb-6">
          Step-by-Step Enrollment Process
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
              01
            </span>
            <h3 className="font-black text-slate-900 text-sm">Submit Application</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Complete the online form below or pick up an admission packet at the campus in Kambia 1.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">
              02
            </span>
            <h3 className="font-black text-slate-900 text-sm">Diagnostic Interview</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Short aptitude and reading assessment to confirm class placement and personalized support.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center">
              03
            </span>
            <h3 className="font-black text-slate-900 text-sm">Offer Letter & Fees</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Receive official letter of admission with fee schedule and uniform measurements.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
              04
            </span>
            <h3 className="font-black text-slate-900 text-sm">Orientation & ID Badge</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Collect student ID card, textbooks, class timetable, and school bus pass for the term.
            </p>
          </div>
        </div>
      </section>

      {/* Two Column: Online Form + Tuition Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Application Form */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <FileText className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black text-slate-900">
              Online Admission Registration Form
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Fill out the details below. Our admissions registrar in Kambia 1 will contact you via SMS or phone call within 24 hours.
          </p>

          {applicationSuccess ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="text-lg font-black text-emerald-950">
                Application Successfully Submitted!
              </h4>
              <p className="text-xs text-emerald-800">
                Application Reference Code: <strong>{applicationSuccess}</strong>
              </p>
              <p className="text-xs text-slate-600">
                We have registered <strong>{studentName}</strong> for <strong>{targetClass}</strong>. Please bring your reference code when visiting the campus in Kambia 1.
              </p>
              <button
                type="button"
                onClick={() => {
                  setApplicationSuccess(null);
                  setStudentName('');
                  setParentPhone('');
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 cursor-pointer"
              >
                Submit Another Application
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marie A. Kamara"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Grade or Program Applied For *
                  </label>
                  <select
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Nursery 1">Nursery 1</option>
                    <option value="Nursery 2">Nursery 2</option>
                    <option value="Nursery 3">Nursery 3</option>
                    <option value="Primary 1">Primary 1</option>
                    <option value="Primary 6 (NPSE)">Primary 6 (NPSE)</option>
                    <option value="JSS 1">JSS 1</option>
                    <option value="JSS 3 (BECE)">JSS 3 (BECE)</option>
                    <option value="SSS 1 (Science)">SSS 1 (Pure & Applied Science)</option>
                    <option value="SSS 1 (Commercial)">SSS 1 (Commercial / Business)</option>
                    <option value="SSS 1 (Arts)">SSS 1 (Arts & Humanities)</option>
                    <option value="SSS 3 (WASSCE)">SSS 3 (WASSCE Examination Class)</option>
                    <option value="College - HND Computer Science">College: HND Computer Science & IT</option>
                    <option value="College - Diploma Business Admin">College: Diploma Business Administration</option>
                    <option value="College - Diploma Education">College: Diploma Educational Pedagogy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Parent / Guardian Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mr. Mohamed Kamara"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Parent / Guardian Mobile (SMS Alerts) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 076 123456 / 078 987654"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Residential Address in Sierra Leone
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kambia 1, Northern Province"
                  value={parentAddress}
                  onChange={(e) => setParentAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Previous School Attended (If Any)
                </label>
                <input
                  type="text"
                  placeholder="School name and last class passed"
                  value={previousSchool}
                  onChange={(e) => setPreviousSchool(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Submitting Admission...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Enrollment Application</span>
                  </>
                )}
              </button>
            </form>
          )}
        </section>

        {/* Tuition Fees & Financial Aid */}
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <CreditCard className="w-5 h-5" />
              </span>
              <h3 className="text-base font-black text-slate-900">
                Tuition Fee Schedule (New Leones)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Approved transparent fee structure for Kambia 1 campus:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800">Nursery 1 – 3</span>
                <span className="font-black text-emerald-700">NLe 450 / Term</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800">Primary (Class 1 – 6)</span>
                <span className="font-black text-emerald-700">NLe 550 / Term</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800">Junior Secondary (JSS 1 – 3)</span>
                <span className="font-black text-emerald-700">NLe 750 / Term</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800">Senior Secondary (SSS 1 – 3)</span>
                <span className="font-black text-emerald-700">NLe 950 / Term</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                <span className="font-bold text-amber-950">College Higher Diplomas</span>
                <span className="font-black text-amber-800">NLe 1,600 / Semester</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 text-xs text-slate-500 border border-slate-100 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                Fees include library access, computer lab usage, and terminal report card. Flexible installment plans available.
              </span>
            </div>
          </div>

          {/* Need Assistance? */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm space-y-3">
            <h4 className="text-sm font-black">
              Questions About Admissions?
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Our Bursary and Admissions Secretariat in Kambia 1 are available Mondays through Fridays from 7:30 AM to 4:30 PM.
            </p>
            <p className="text-xs font-black text-emerald-400">
              Hotline: {SCHOOL_INFO.phone}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
