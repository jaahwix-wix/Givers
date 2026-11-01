/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Eye, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Calendar, 
  Sparkles,
  Maximize2,
  Upload,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ScrollFadeIn from './ScrollFadeIn';
import { 
  ATTACHED_SCHOOL_PHOTOS, 
  AttachedSchoolPhoto,
  getSchoolPhotoSrc, 
  isPhotoSynced, 
  onSchoolPhotosUpdated,
  saveSchoolPhoto,
  getSyncedPhotosCount
} from '../../utils/photoManager';
import PhotoSyncModal from './PhotoSyncModal';

export default function EventsGallery() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);
  const singleFileInputRef = React.useRef<HTMLInputElement>(null);

  const categories = [
    'All',
    'Classrooms & Exams',
    'Secondary Scholars',
    'Nursery Graduation',
    'College & Senior Robes',
    'Assembly & Worship'
  ];

  const refreshCount = () => {
    setSyncedCount(getSyncedPhotosCount());
  };

  useEffect(() => {
    refreshCount();
    const unsub = onSchoolPhotosUpdated(refreshCount);
    return unsub;
  }, []);

  const filteredPhotos = activeCategory === 'All'
    ? ATTACHED_SCHOOL_PHOTOS
    : ATTACHED_SCHOOL_PHOTOS.filter(p => p.category === activeCategory);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === 'Escape') setSelectedPhotoIndex(null);
      if (e.key === 'ArrowRight') {
        setSelectedPhotoIndex((prev) => (prev !== null ? (prev + 1) % filteredPhotos.length : null));
      }
      if (e.key === 'ArrowLeft') {
        setSelectedPhotoIndex((prev) => (prev !== null ? (prev - 1 + filteredPhotos.length) % filteredPhotos.length : null));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, filteredPhotos.length]);

  const currentPhoto = selectedPhotoIndex !== null ? filteredPhotos[selectedPhotoIndex] : null;

  return (
    <section className="space-y-8" id="events-gallery-section">
      <ScrollFadeIn direction="up">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider mb-2">
              <Camera className="w-3.5 h-3.5 text-emerald-700" />
              <span>Authentic Campus Photography</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Real Campus Life & Events Gallery
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed font-normal">
              Featuring authentic photography from Givers World Mission Diplomats Academy & College in Kambia 1—from primary classroom examinations and junior secondary blazer scholars to nursery commencement and college graduations.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Authentic Photos Active Indicator & Manage Option */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold text-xs shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>10/10 Authentic Campus Photos Active</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSyncModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                title="Manage photo gallery"
              >
                <Camera className="w-3.5 h-3.5 text-slate-500" />
                <span>Manage Photos</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-auto">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
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
        </div>
      </ScrollFadeIn>

      {/* Responsive Masonry Grid using Tailwind multi-column layout */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {filteredPhotos.map((photo, idx) => {
          const imgSrc = getSchoolPhotoSrc(photo.filename);
          const isSynced = isPhotoSynced(photo.filename);

          return (
            <ScrollFadeIn
              key={photo.id}
              direction="up"
              delay={idx * 0.05}
              className="break-inside-avoid"
            >
              <div
                onClick={() => setSelectedPhotoIndex(idx)}
                className="group relative rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-xs hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
              >
                <div className="relative overflow-hidden bg-slate-900 min-h-[220px] flex items-center justify-center">
                  <img
                    src={imgSrc}
                    alt={photo.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    onError={(e) => {
                      // Fallback overlay for images awaiting drop
                      const target = e.target as HTMLElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />

                  {/* Fallback Display if image is still pending */}
                  <div 
                    style={{ display: 'none' }}
                    className="absolute inset-0 flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold text-[10px] uppercase tracking-wider mb-2">
                      {photo.category}
                    </span>
                    <h4 className="font-black text-sm text-white leading-tight">
                      {photo.title}
                    </h4>
                    <p className="text-[10px] text-slate-300 mt-2 font-mono">
                      {photo.filename}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSyncModalOpen(true);
                      }}
                      className="mt-3 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload / Drop Image</span>
                    </button>
                  </div>

                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-white">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider self-start">
                        {photo.category}
                      </span>
                      <span className="text-[10px] text-slate-300 font-mono">
                        {photo.filename}
                      </span>
                    </div>
                    <h4 className="font-black text-sm text-white leading-tight">
                      {photo.title}
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {photo.caption}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-emerald-300 font-bold border-t border-white/20 pt-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Kambia 1 Campus
                      </span>
                      <span className="flex items-center gap-1 text-white">
                        <Maximize2 className="w-3 h-3" />
                        Enlarge Photo
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom Meta Bar */}
                <div className="p-3.5 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate">
                      {photo.title}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {photo.date} • {photo.filename}
                    </p>
                  </div>
                  {isSynced && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black flex items-center gap-1 flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Synced
                    </span>
                  )}
                </div>
              </div>
            </ScrollFadeIn>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {currentPhoto && selectedPhotoIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            onClick={() => setSelectedPhotoIndex(null)}
          >
            <button
              type="button"
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute top-5 right-5 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-50"
              aria-label="Close Lightbox"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Previous Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPhotoIndex((prev) => (prev !== null ? (prev - 1 + filteredPhotos.length) % filteredPhotos.length : null));
              }}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer z-50"
              aria-label="Previous Photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPhotoIndex((prev) => (prev !== null ? (prev + 1) % filteredPhotos.length : null));
              }}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer z-50"
              aria-label="Next Photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Content Container */}
            <div
              className="max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-800 max-h-[65vh] sm:max-h-[72vh] flex items-center justify-center">
                <img
                  src={getSchoolPhotoSrc(currentPhoto.filename)}
                  alt={currentPhoto.title}
                  referrerPolicy="no-referrer"
                  className="max-h-[65vh] sm:max-h-[72vh] w-auto max-w-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div 
                  style={{ display: 'none' }}
                  className="w-96 h-80 flex flex-col items-center justify-center p-8 text-center bg-slate-900 text-white"
                >
                  <Camera className="w-12 h-12 text-emerald-400 mb-3" />
                  <p className="font-bold text-sm">{currentPhoto.title}</p>
                  <p className="text-xs text-slate-400 font-mono mt-1">{currentPhoto.filename}</p>
                </div>
              </div>

              {/* Caption & Metadata */}
              <div className="mt-4 bg-slate-900/90 border border-slate-800 text-white p-4 sm:p-5 rounded-2xl max-w-2xl w-full text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-xs uppercase">
                    {currentPhoto.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {currentPhoto.filename}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  {currentPhoto.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  {currentPhoto.caption}
                </p>
                <div className="pt-1 flex items-center justify-center gap-4 text-xs text-emerald-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    Kambia 1 Campus
                  </span>
                  <span>•</span>
                  <span>Photo {selectedPhotoIndex + 1} of {filteredPhotos.length}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Sync Modal */}
      <PhotoSyncModal 
        isOpen={isSyncModalOpen} 
        onClose={() => setIsSyncModalOpen(false)} 
      />
    </section>
  );
}
