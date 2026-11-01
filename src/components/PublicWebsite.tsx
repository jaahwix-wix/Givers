/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { ClassNotice, Student, UserRole } from '../types';
import { getSavedClassNotices } from '../utils/smsNoticeUtils';

import WebsiteNavbar from './website/WebsiteNavbar';
import WebsiteFooter from './website/WebsiteFooter';
import PageTransition from './website/PageTransition';

import HomePage from './website/pages/HomePage';
import AboutPage from './website/pages/AboutPage';
import AcademicsPage from './website/pages/AcademicsPage';
import FacilitiesPage from './website/pages/FacilitiesPage';
import NoticesPage from './website/pages/NoticesPage';
import AdmissionsPage from './website/pages/AdmissionsPage';
import ContactPage from './website/pages/ContactPage';
import NewsPage from './website/pages/NewsPage';
import GalleryPage from './website/pages/GalleryPage';
import PortalLoginPage from './website/pages/PortalLoginPage';

interface PublicWebsiteProps {
  onEnterPortal: (targetTab?: string) => void;
  students?: Student[];
}

export default function PublicWebsite({ onEnterPortal, students = [] }: PublicWebsiteProps) {
  const { unlockSession, switchRole } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [notices, setNotices] = useState<ClassNotice[]>(() => getSavedClassNotices());

  // Listen for real-time notice dispatches
  useEffect(() => {
    const handleNoticesUpdate = () => {
      setNotices(getSavedClassNotices());
    };
    window.addEventListener('sma_class_notice_dispatched', handleNoticesUpdate);
    window.addEventListener('storage', handleNoticesUpdate);
    return () => {
      window.removeEventListener('sma_class_notice_dispatched', handleNoticesUpdate);
      window.removeEventListener('storage', handleNoticesUpdate);
    };
  }, []);

  // Check URL query parameters for direct MIS access
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('view') === 'portal' || searchParams.get('view') === 'mis' || window.location.hash === '#mis') {
        handleLoginSuccess('admin');
      }
    } catch {}
  }, []);

  const handleNavigate = (page: string) => {
    if (page === 'mis' || page === 'dashboard') {
      handleLoginSuccess('admin');
      return;
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (role: UserRole, studentAdmissionNumber?: string) => {
    if (studentAdmissionNumber) {
      localStorage.setItem('sma_active_portal_student', studentAdmissionNumber);
    }
    unlockSession(role);
    switchRole(role);
    if (role === 'student_parent') {
      onEnterPortal('student-portal');
    } else if (role === 'teacher') {
      onEnterPortal('performance');
    } else if (role === 'bursar') {
      onEnterPortal('fees');
    } else if (role === 'transport') {
      onEnterPortal('bus-service');
    } else {
      onEnterPortal('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white" id="public-website-root">
      {/* 1. Official Header & Multi-Page Navigation Bar */}
      <WebsiteNavbar 
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onEnterMIS={() => handleLoginSuccess('admin')}
        noticeCount={notices.length}
      />

      {/* 2. Main Page Content with Smooth Motion Page Transition */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12">
        <AnimatePresence mode="wait">
          <PageTransition pageKey={currentPage}>
            {currentPage === 'home' && (
              <HomePage 
                onNavigate={handleNavigate}
                notices={notices}
              />
            )}

            {currentPage === 'about' && (
              <AboutPage 
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'academics' && (
              <AcademicsPage 
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'facilities' && (
              <FacilitiesPage 
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'notices' && (
              <NoticesPage 
                notices={notices}
              />
            )}

            {currentPage === 'news' && (
              <NewsPage />
            )}

            {currentPage === 'gallery' && (
              <GalleryPage />
            )}

            {currentPage === 'admissions' && (
              <AdmissionsPage />
            )}

            {currentPage === 'contact' && (
              <ContactPage />
            )}

            {currentPage === 'login' && (
              <PortalLoginPage 
                onLoginSuccess={handleLoginSuccess}
                onNavigateHome={() => handleNavigate('home')}
                students={students}
              />
            )}
          </PageTransition>
        </AnimatePresence>
      </main>

      {/* 3. Comprehensive Global Footer */}
      <WebsiteFooter 
        onNavigate={handleNavigate}
      />
    </div>
  );
}
