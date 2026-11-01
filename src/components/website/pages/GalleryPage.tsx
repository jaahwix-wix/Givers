/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Camera, Sparkles, MapPin } from 'lucide-react';
import EventsGallery from '../EventsGallery';
import ScrollFadeIn from '../ScrollFadeIn';

export default function GalleryPage() {
  return (
    <div className="space-y-12 pb-12" id="website-gallery-page">
      {/* Banner */}
      <ScrollFadeIn direction="up">
        <section className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl">
          <div className="max-w-3xl space-y-3">
            <span className="px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-black uppercase tracking-wider">
              Visual Archives & School Life
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Events & Campus Life Gallery
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              A vibrant photographic record of pupils and students at Givers World Mission Diplomats Academy & College in Kambia 1—showcasing active classroom instruction, modern computer laboratory practicals, science experiments, Christian moral devotions, sports gala, and college commencements.
            </p>
          </div>
        </section>
      </ScrollFadeIn>

      {/* Main Events Gallery Component with Responsive Masonry Grid & Lightbox */}
      <EventsGallery />
    </div>
  );
}
