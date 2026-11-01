/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Sparkles,
  ShieldCheck,
  User,
  MessageSquare,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import ScrollFadeIn from './ScrollFadeIn';
import { SCHOOL_INFO } from '../../initialData';

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    inquiryType: 'Admissions 2026/2027',
    message: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{ id: string; name: string } | null>(null);

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Full name is required.';
        if (value.trim().length < 2) return 'Name must be at least 2 characters.';
        return '';
      case 'email':
        if (!value.trim()) return 'Email address is required.';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) return 'Please enter a valid email address (e.g., parent@gmail.com).';
        return '';
      case 'message':
        if (!value.trim()) return 'Message content is required.';
        if (value.trim().length < 10) return 'Please provide more details in your message (minimum 10 characters).';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof typeof formData]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nameError = validateField('name', formData.name);
    const emailError = validateField('email', formData.email);
    const messageError = validateField('message', formData.message);

    const newErrors = {
      name: nameError,
      email: emailError,
      message: messageError
    };

    setErrors(newErrors);
    setTouched({ name: true, email: true, message: true });

    if (nameError || emailError || messageError) {
      return;
    }

    setIsSubmitting(true);

    // Simulate reliable dispatch to administration
    setTimeout(() => {
      const randomTicketId = `GWM-INQ-${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Store in local storage for administration review
      try {
        const existing = JSON.parse(localStorage.getItem('gwda_public_inquiries') || '[]');
        existing.unshift({
          id: randomTicketId,
          ...formData,
          submittedAt: new Date().toISOString()
        });
        localStorage.setItem('gwda_public_inquiries', JSON.stringify(existing));
      } catch (err) {
        console.error('Inquiry storage error:', err);
      }

      setSubmittedTicket({ id: randomTicketId, name: formData.name });
      setIsSubmitting(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        inquiryType: 'Admissions 2026/2027',
        message: ''
      });
      setTouched({});
      setErrors({});
    }, 600);
  };

  return (
    <section className="space-y-8" id="contact-us-section">
      <ScrollFadeIn direction="up">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
            <span>Public Inquiries & Helpdesk</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Contact School Administration
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Have questions about admissions, student records, fee schedules, or college diploma courses? Send a direct message to our administrative office in Kambia 1.
          </p>
        </div>
      </ScrollFadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Campus Info & Direct Channels */}
        <ScrollFadeIn direction="right" className="lg:col-span-5">
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800 shadow-xl">
            <div>
              <span className="text-emerald-400 text-xs font-extrabold tracking-wider uppercase">
                Campus Secretariat
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                Givers World Mission
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Diplomats Academy & College • Kambia 1
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-200">Compound Physical Address</h4>
                  <p className="text-slate-300 mt-0.5 leading-relaxed font-semibold">
                    Givers World Mission Compound Kambia Town Sierra Leone.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <Phone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-200">Phone & SMS Inquiries</h4>
                  <p className="text-slate-300 mt-0.5 leading-relaxed font-mono font-bold text-sm">
                    <a href="tel:+23274155000" className="hover:text-emerald-400 transition-colors">
                      +232 74155000
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <Mail className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-200">Email Correspondence</h4>
                  <p className="text-slate-400 mt-0.5 leading-relaxed font-mono text-[11px]">
                    {SCHOOL_INFO.email}<br />
                    admissions@giversworldmission.sl
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <Clock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-200">Office Working Hours</h4>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">
                    Monday – Friday: 7:30 AM – 4:30 PM<br />
                    Saturday (College Lectures): 8:00 AM – 2:00 PM<br />
                    Sunday: Closed for Worship Devotions
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-[11px] text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Direct response within 24 business hours guaranteed.</span>
            </div>
          </div>
        </ScrollFadeIn>

        {/* Right Column: Contact Inquiry Form */}
        <ScrollFadeIn direction="left" className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            {submittedTicket ? (
              <div className="py-8 text-center space-y-4 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 inline-block mb-2">
                    Reference ID: {submittedTicket.id}
                  </span>
                  <h3 className="text-xl font-black text-slate-900">
                    Inquiry Dispatched Successfully!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                    Thank you, <strong>{submittedTicket.name}</strong>. Your message has been logged in the administration dispatch register in Kambia 1. Our academic or admissions coordinator will respond to your email shortly.
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setSubmittedTicket(null)}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Send Another Inquiry</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4.5" noValidate>
                <div className="border-b border-slate-100 pb-3 mb-2">
                  <h3 className="text-base font-black text-slate-900">
                    Send a Message to Administration
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fields marked with <span className="text-rose-500 font-bold">*</span> are required.
                  </p>
                </div>

                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name Field */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Your Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        onBlur={() => handleBlur('name')}
                        placeholder="e.g., Mohamed S. Conteh"
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border transition-all focus:outline-hidden ${
                          touched.name && errors.name
                            ? 'border-rose-500 bg-rose-50/20 text-slate-900 ring-1 ring-rose-500'
                            : touched.name && !errors.name
                            ? 'border-emerald-500 bg-emerald-50/20 text-slate-900'
                            : 'border-slate-300 text-slate-900 focus:border-emerald-600 focus:bg-white'
                        }`}
                      />
                      {touched.name && !errors.name && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-3 pointer-events-none" />
                      )}
                    </div>
                    {touched.name && errors.name && (
                      <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                        placeholder="e.g., parent@gmail.com"
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border transition-all focus:outline-hidden ${
                          touched.email && errors.email
                            ? 'border-rose-500 bg-rose-50/20 text-slate-900 ring-1 ring-rose-500'
                            : touched.email && !errors.email
                            ? 'border-emerald-500 bg-emerald-50/20 text-slate-900'
                            : 'border-slate-300 text-slate-900 focus:border-emerald-600 focus:bg-white'
                        }`}
                      />
                      {touched.email && !errors.email && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-3 pointer-events-none" />
                      )}
                    </div>
                    {touched.email && errors.email && (
                      <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone & Inquiry Type Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone Field (Optional) */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Phone / WhatsApp Number <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="e.g., +232 76 123 456"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-hidden transition-all"
                    />
                  </div>

                  {/* Inquiry Topic */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Inquiry Department / Subject
                    </label>
                    <select
                      value={formData.inquiryType}
                      onChange={(e) => handleChange('inquiryType', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-hidden transition-all cursor-pointer font-medium"
                    >
                      <option value="Admissions 2026/2027">Admissions & New Enrollment (2026/2027)</option>
                      <option value="Tuition & Fees">Tuition Accounts & Payment Inquiries</option>
                      <option value="College Programs">College Higher Diploma & Certificate Courses</option>
                      <option value="Examinations">NPSE, BECE & WASSCE Verification</option>
                      <option value="Transportation">School Bus Routes & Logistics</option>
                      <option value="General Administration">General Information & Visiting Campus</option>
                    </select>
                  </div>
                </div>

                {/* Message Textarea */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Your Message <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formData.message.length} characters (min 10)
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    onBlur={() => handleBlur('message')}
                    placeholder="Write your inquiry here. For admissions, please specify your child's age or target class..."
                    className={`w-full p-3 rounded-xl text-xs sm:text-sm bg-slate-50 border transition-all focus:outline-hidden resize-none ${
                      touched.message && errors.message
                        ? 'border-rose-500 bg-rose-50/20 text-slate-900 ring-1 ring-rose-500'
                        : touched.message && !errors.message
                        ? 'border-emerald-500 bg-emerald-50/20 text-slate-900'
                        : 'border-slate-300 text-slate-900 focus:border-emerald-600 focus:bg-white'
                    }`}
                  />
                  {touched.message && errors.message && (
                    <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.message}</span>
                    </p>
                  )}
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending to Administration...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Dispatch Inquiry to School Administration</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
}
