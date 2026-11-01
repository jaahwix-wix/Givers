/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Newspaper, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  Tag, 
  Share2, 
  Check, 
  X, 
  ExternalLink,
  BookOpen,
  Award,
  BellRing,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ScrollFadeIn from './ScrollFadeIn';

export interface NewsArticle {
  id: string;
  title: string;
  category: 'Academics' | 'Announcements' | 'Facilities' | 'Community';
  date: string;
  author: string;
  readTime: string;
  summary: string;
  content: string[];
  featured?: boolean;
}

const INITIAL_NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'WAEC Re-Accreditation: Diplomats Academy Re-Confirmed as Premier WASSCE & BECE Exam Center',
    category: 'Academics',
    date: 'September 12, 2026',
    author: 'Office of Academic Affairs',
    readTime: '3 min read',
    featured: true,
    summary: 'The West African Examinations Council (WAEC) and the Ministry of Basic and Senior Secondary Education (MBSSE) have officially renewed our testing center accreditation with commendations for biometric security and academic integrity in Kambia District.',
    content: [
      'The West African Examinations Council (WAEC) and the Ministry of Basic and Senior Secondary Education (MBSSE) have officially confirmed Givers World Mission Diplomats Academy as an accredited center of excellence for the upcoming 2026/2027 NPSE, BECE, and WASSCE national examinations.',
      'Following a comprehensive inspection of our ventilated examination halls, secure vault facilities, and biometric attendance protocols in Kambia 1, inspectors praised the institution for zero-tolerance on examination malpractice and superior seating infrastructure.',
      'Principal Evangelist Saint Turay remarked: "Our students prepare diligently under God and through rigorous classroom coaching. This re-accreditation validates the dedication of our teaching faculty and ensures our pupils sit their national milestones right here in Kambia without needing to travel."',
      'Candidate registration for the 2027 WASSCE and BECE cycles is currently ongoing at the School Bursary.'
    ]
  },
  {
    id: 'news-2',
    title: 'Expansion of Modern Computer Lab with 20 New Solar-Powered High-Speed Workstations',
    category: 'Facilities',
    date: 'September 04, 2026',
    author: 'ICT & Engineering Dept.',
    readTime: '2 min read',
    featured: false,
    summary: 'To ensure continuous practical digital literacy even during local grid outages, the school has installed 20 brand-new desktop units backed by an upgraded 10kVA solar inverter system in Kambia 1.',
    content: [
      'In line with our mission to make Kambia youth competitive in global technological standards, Givers World Mission Diplomats Academy & College has expanded our digital laboratory with 20 additional modern computer workstations.',
      'The upgraded facility features independent 10kVA solar power storage, ensuring uninterrupted practical lessons in Python programming, Microsoft Office Suite, graphic design, and typing speed training.',
      'Students from Primary 4 through College Certificate levels receive hands-on computer laboratory sessions twice weekly.'
    ]
  },
  {
    id: 'news-3',
    title: 'Admissions Open for 2026/2027 Academic Session Across All Nursery, School & College Streams',
    category: 'Announcements',
    date: 'August 28, 2026',
    author: 'Admissions Directorate',
    readTime: '4 min read',
    featured: false,
    summary: 'Prospective parents and college applicants can now pick up admission forms at the school campus on Mission Road, Kambia 1, or complete initial pre-registration online without any application fees.',
    content: [
      'The Directorate of Admissions announces that enrollment is officially open for the 2026/2027 academic session.',
      'Programs accepting new candidates include Nursery & Kindergarten (Ages 3-5), Primary 1-6 (NPSE track), Junior Secondary JSS 1-3, Senior Secondary SSS 1-3 (Science, Arts, Commerce), and College Higher Diploma courses in Business, IT, and Teacher Education.',
      'Early enrollment is strongly advised as classroom sizes are capped at 35 pupils per section to maintain personalized pedagogical attention.',
      'Parents can visit the Bursary Monday through Friday, 7:30 AM to 4:30 PM, or submit an inquiry through our public website.'
    ]
  },
  {
    id: 'news-4',
    title: 'Eagles Squad Annual Inter-House Athletics & Sports Gala Slated for November at Kambia 1 Field',
    category: 'Community',
    date: 'August 15, 2026',
    author: 'Sports & Student Affairs',
    readTime: '2 min read',
    featured: false,
    summary: 'The four student houses—Eagle, Falcon, Hawk, and Dove—are preparing for track, field, football, and traditional cultural performances in Kambia 1.',
    content: [
      'The annual Givers World Mission Inter-House Sports and Cultural Gala will take place this November, bringing together pupils, teachers, parents, and Kambia District community leaders.',
      'Events include 100m/200m/400m track sprints, relay races, high jump, inter-class football tournaments, and a traditional cultural parade showcasing Sierra Leone heritage.',
      'The sports committee promises an exhilarating, disciplined tournament promoting sportsmanship, team spirit, and Christian fraternity among students.'
    ]
  }
];

export default function SchoolNewsSection() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['All', 'Academics', 'Announcements', 'Facilities', 'Community'];

  const filteredArticles = activeCategory === 'All'
    ? INITIAL_NEWS_ARTICLES
    : INITIAL_NEWS_ARTICLES.filter(a => a.category === activeCategory);

  const handleShare = (article: NewsArticle) => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${article.title} - Read more on Givers World Mission School Website: ${window.location.href}`);
      setCopiedId(article.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  return (
    <section className="space-y-8" id="school-news-section">
      {/* Section Header */}
      <ScrollFadeIn direction="up">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider mb-2">
              <Newspaper className="w-3.5 h-3.5 text-emerald-700" />
              <span>Public Notice & Bulletin</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              School News & Official Updates
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Stay informed with recent institutional developments, examination announcements, campus milestones, and community dispatches in Kambia 1—open to all visitors without requiring any login.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-auto">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </ScrollFadeIn>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article, index) => {
          const isPrimary = index === 0 && activeCategory === 'All';
          return (
            <ScrollFadeIn 
              key={article.id} 
              direction="up" 
              delay={index * 0.08}
              className={isPrimary ? 'md:col-span-2 lg:col-span-2' : ''}
            >
              <article 
                className={`h-full rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group ${
                  isPrimary ? 'p-6 sm:p-7 bg-gradient-to-br from-white via-white to-emerald-50/40' : 'p-5 sm:p-6'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider ${
                      article.category === 'Academics' ? 'bg-emerald-100 text-emerald-800' :
                      article.category === 'Facilities' ? 'bg-blue-100 text-blue-800' :
                      article.category === 'Announcements' ? 'bg-amber-100 text-amber-900' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {article.category}
                    </span>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>{article.readTime}</span>
                    </div>
                  </div>

                  <h3 className={`font-black text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors ${
                    isPrimary ? 'text-lg sm:text-xl' : 'text-base'
                  }`}>
                    {article.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 font-normal">
                    {article.summary}
                  </p>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-400 font-medium text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{article.date}</span>
                    <span>•</span>
                    <span className="truncate max-w-[120px] sm:max-w-[180px]">{article.author}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleShare(article)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Share Article Link"
                    >
                      {copiedId === article.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedArticle(article)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 group-hover:bg-emerald-600 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>Read Story</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </article>
            </ScrollFadeIn>
          );
        })}
      </div>

      {/* Article Detail Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col"
            >
              {/* Modal Header Bar */}
              <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between gap-4">
                <div className="space-y-1.5 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                      {selectedArticle.category}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {selectedArticle.date}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-xl font-black text-white leading-snug">
                    {selectedArticle.title}
                  </h3>
                  <p className="text-xs text-emerald-400 font-bold">
                    By {selectedArticle.author} • Kambia 1, Sierra Leone
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Article Body */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-4 text-sm text-slate-700 leading-relaxed">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold text-xs leading-relaxed">
                  {selectedArticle.summary}
                </div>

                {selectedArticle.content.map((paragraph, idx) => (
                  <p key={idx} className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                    {paragraph}
                  </p>
                ))}

                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Givers World Mission Diplomats Academy, Kambia 1</span>
                  </span>
                  <span>Published for Open Public Access</span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleShare(selectedArticle)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedId === selectedArticle.id ? 'Link Copied!' : 'Share Article'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Close Article
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
