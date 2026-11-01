/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Sparkles, 
  GraduationCap, 
  BookOpen, 
  ArrowRight,
  ShieldCheck,
  MapPin,
  Award,
  Users,
  LayoutDashboard
} from 'lucide-react';
import { getSchoolPhotoSrc, onSchoolPhotosUpdated } from '../../utils/photoManager';

interface Slide {
  id: string;
  filename: string;
  title: string;
  subtitle: string;
  category: string;
  icon: any;
  alt: string;
  ctaText: string;
  ctaAction: string;
  stats: { label: string; value: string };
}

const SLIDES_CONFIG: Slide[] = [
  {
    id: 'scholars',
    filename: 'IMG-20260918-WA0028.jpg',
    title: 'Nurturing Academic & Moral Champions in Kambia 1',
    subtitle: 'From Nursery to College Diplomas, our pupils and students thrive in a disciplined, Christian-principled environment with 100% NPSE, BECE & WASSCE pass rates.',
    category: 'Secondary Scholars & Eagles Squad',
    icon: GraduationCap,
    alt: 'Givers World Mission Diplomats Academy scholars in official uniform blazers with faculty in Kambia 1',
    ctaText: 'Explore Academics & College',
    ctaAction: 'academics',
    stats: { label: 'Accreditation', value: 'MBSDSE Approved' }
  },
  {
    id: 'classroom',
    filename: 'IMG-20260918-WA0027.jpg',
    title: 'Interactive Classrooms with Rigorous Examination',
    subtitle: 'Primary pupils seated in ventilated classrooms at individual desks, mastering coursework and national examination syllabus under dedicated educators.',
    category: 'Primary Classroom & Exams',
    icon: BookOpen,
    alt: 'Primary pupils writing examination tests in classroom at Givers World Mission in Kambia 1',
    ctaText: 'View Class Noticeboard & SMS',
    ctaAction: 'notices',
    stats: { label: 'Examination Center', value: 'WAEC / NPSE / BECE' }
  },
  {
    id: 'graduation-lineup',
    filename: 'IMG-20260918-WA0020.jpg',
    title: 'Annual Commencement & Milestone Graduation',
    subtitle: 'Celebrating the academic excellence and promotion of pupils across Nursery, Primary, and Secondary divisions in full academic regalia.',
    category: 'Annual Convocation Ceremony',
    icon: Award,
    alt: 'Grand graduation ceremony lineup of pupils in academic robes at Givers World Mission in Kambia',
    ctaText: 'Browse Events Gallery',
    ctaAction: 'gallery',
    stats: { label: 'Excellence', value: '100% Pass Rates' }
  },
  {
    id: 'college-green',
    filename: 'IMG-20260918-WA0022.jpg',
    title: 'College Division: Higher Diplomas & Professional Degrees',
    subtitle: 'Equipping senior scholars and future leaders with accredited tertiary certifications, leadership mentorship, and community diplomatic service.',
    category: 'College Division Scholars',
    icon: Users,
    alt: 'Graduating female scholars in emerald green robes in assembly hall at Givers World Mission College',
    ctaText: 'Tour Campus Facilities',
    ctaAction: 'facilities',
    stats: { label: 'Division', value: 'College of Theology & Tech' }
  },
  {
    id: 'nursery-grad',
    filename: 'IMG-20260918-WA0029.jpg',
    title: 'Early Childhood & Nursery Graduation Class',
    subtitle: 'Young pupils in immaculate white gowns and caps celebrating early childhood milestones in Kambia 1.',
    category: 'Nursery Graduation & Foundation',
    icon: Award,
    alt: 'Nursery graduates in white academic gowns celebrating in Kambia 1',
    ctaText: 'Enroll in Nursery & Primary',
    ctaAction: 'admissions',
    stats: { label: 'Early Years', value: 'Ages 3 - 6' }
  },
  {
    id: 'chapel-convocation',
    filename: 'IMG-20260918-WA0025.jpg',
    title: 'Chapel Convocation & Assembly with Band',
    subtitle: 'Grand graduation ceremony in the assembly hall with junior & senior graduates alongside the school band drum kit.',
    category: 'Assembly & Christian Worship',
    icon: Sparkles,
    alt: 'Graduates assembled in hall with school drum kit at Givers World Mission Kambia',
    ctaText: 'View Events Gallery',
    ctaAction: 'gallery',
    stats: { label: 'Tradition', value: 'Christian Devotion' }
  },
  {
    id: 'senior-mentor',
    filename: 'IMG-20260918-WA0023.jpg',
    title: 'Senior Graduates with Academic Mentor',
    subtitle: 'Senior graduating class in sky-blue robes and white stoles celebrating alongside their teacher outdoors on campus grounds.',
    category: 'Senior Graduation & Faculty',
    icon: GraduationCap,
    alt: 'Senior graduating scholars in sky blue regalia with mentor on campus grounds',
    ctaText: 'Meet Our Faculty',
    ctaAction: 'about',
    stats: { label: 'Mentorship', value: 'Dedicated Tutors' }
  },
  {
    id: 'faculty-leaders',
    filename: 'IMG-20260918-WA0026.jpg',
    title: 'Academic Leaders & Faculty Mentorship',
    subtitle: 'Secondary school pupils and faculty standing together with academic report folios, upholding high moral discipline.',
    category: 'Secondary Leadership & Governance',
    icon: ShieldCheck,
    alt: 'Secondary students in blazers with faculty leadership in Kambia',
    ctaText: 'Read Academy Profile',
    ctaAction: 'about',
    stats: { label: 'Leadership', value: 'Eagles Squad' }
  }
];

interface HomeSlideshowProps {
  onNavigate: (page: string) => void;
}

export default function HomeSlideshow({ onNavigate }: HomeSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<number>(1);
  const [, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const unsub = onSchoolPhotosUpdated(() => {
      setUpdateTrigger(prev => prev + 1);
    });
    return unsub;
  }, []);

  // Autoplay timer
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % SLIDES_CONFIG.length);
    }, 6500);

    return () => clearInterval(interval);
  }, [isPaused, currentIndex]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % SLIDES_CONFIG.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + SLIDES_CONFIG.length) % SLIDES_CONFIG.length);
  };

  const handleDotClick = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const currentSlide = SLIDES_CONFIG[currentIndex];
  const IconComponent = currentSlide.icon;
  const currentImgSrc = getSchoolPhotoSrc(currentSlide.filename);

  return (
    <div 
      className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      id="hero-slideshow-container"
    >
      {/* 16:9 / Responsive Height Hero Container */}
      <div className="relative w-full min-h-[440px] sm:min-h-[520px] md:min-h-[580px] lg:min-h-[620px] flex items-end">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentSlide.id}
            custom={direction}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            <img 
              src={currentImgSrc} 
              alt={currentSlide.alt}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center transform scale-100 transition-transform duration-7000 ease-out"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (!img.src.includes('IMG-20260918-WA0027.jpg')) {
                  img.src = '/school-photos/IMG-20260918-WA0027.jpg';
                }
              }}
            />
            
            {/* Cinematic Gradients for Optimal Contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent" />

            {/* Slide Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 md:p-14 max-w-4xl">
              {/* Category Pill & Location Badge */}
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-emerald-600/90 text-white shadow-md backdrop-blur-md">
                  <IconComponent className="w-3.5 h-3.5" />
                  {currentSlide.category}
                </span>
                
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 text-amber-300 border border-slate-700/60 backdrop-blur-md">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  Kambia 1, Northern Province
                </span>

                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-white/90 backdrop-blur-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Eagles Squad
                </span>

                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800/80 text-slate-300 backdrop-blur-md">
                  {currentSlide.filename}
                </span>
              </div>

              {/* Slide Heading */}
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-3 drop-shadow-sm"
              >
                {currentSlide.title}
              </motion.h2>

              {/* Subtitle */}
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-sm sm:text-base md:text-lg text-slate-200 max-w-2xl leading-relaxed mb-6 font-normal drop-shadow-xs"
              >
                {currentSlide.subtitle}
              </motion.p>

              {/* Slide Actions */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap items-center gap-3"
              >
                <button
                  type="button"
                  onClick={() => onNavigate('mis')}
                  className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-black/40 transition-all hover:scale-[1.02] cursor-pointer"
                  id="slideshow-launch-mis-btn"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Launch MIS System</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate(currentSlide.ctaAction)}
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:translate-x-0.5 cursor-pointer"
                  id={`slideshow-btn-${currentSlide.id}`}
                >
                  <span>{currentSlide.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('gallery')}
                  className="px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-100 font-bold text-sm border border-slate-700/80 backdrop-blur-md transition-colors cursor-pointer"
                >
                  View 10 Campus Photos
                </button>

                <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs text-slate-300 backdrop-blur-md ml-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-white">{currentSlide.stats.label}:</span>
                  <span>{currentSlide.stats.value}</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Previous Slide Button */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous Slide"
          className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-slate-950/40 hover:bg-slate-900/80 text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition-all duration-200 cursor-pointer z-20 hover:scale-105"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Next Slide Button */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next Slide"
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-slate-950/40 hover:bg-slate-900/80 text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition-all duration-200 cursor-pointer z-20 hover:scale-105"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Bottom Control Bar: Dots & Pause/Play */}
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-8 z-20 flex items-center gap-2 p-1.5 rounded-full bg-slate-950/60 border border-slate-800/80 backdrop-blur-md">
          {/* Pause / Play Toggle */}
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
            className="p-1.5 rounded-full text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <div className="h-3 w-px bg-slate-700" />

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5 px-1">
            {SLIDES_CONFIG.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => handleDotClick(idx)}
                aria-label={`Go to slide ${idx + 1}: ${slide.title}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? 'w-6 h-2 bg-emerald-500'
                    : 'w-2 h-2 bg-slate-600 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
