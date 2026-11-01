/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Newspaper, BellRing } from 'lucide-react';
import SchoolNewsSection from '../SchoolNewsSection';
import ScrollFadeIn from '../ScrollFadeIn';

export default function NewsPage() {
  return (
    <div className="space-y-12 pb-12" id="website-news-page">
      {/* Banner */}
      <ScrollFadeIn direction="up">
        <section className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl">
          <div className="max-w-3xl space-y-3">
            <span className="px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-black uppercase tracking-wider">
              Public Dispatch & Announcements
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              School News & Official Bulletins
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Official press announcements, academic calendar milestones, WAEC examination center updates, and community news from Givers World Mission Diplomats Academy & College in Kambia 1—open to all visitors without requiring any login.
            </p>
          </div>
        </section>
      </ScrollFadeIn>

      {/* Main School News Section */}
      <SchoolNewsSection />
    </div>
  );
}
