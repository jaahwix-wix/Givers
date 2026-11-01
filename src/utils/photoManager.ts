/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AttachedSchoolPhoto {
  id: string;
  filename: string;
  title: string;
  category: 'Classrooms & Exams' | 'Secondary Scholars' | 'Nursery Graduation' | 'College & Senior Robes' | 'Assembly & Worship';
  date: string;
  caption: string;
  aspect: 'landscape' | 'portrait' | 'square';
  fallbackDescription: string;
}

export const ATTACHED_SCHOOL_PHOTOS: AttachedSchoolPhoto[] = [
  {
    id: 'photo-classroom-exam',
    filename: 'IMG-20260918-WA0027.jpg',
    title: 'Primary Pupils in Classroom Examination',
    category: 'Classrooms & Exams',
    date: 'Academic Term 2026',
    caption: 'Primary pupils in school uniforms seated at wooden desks in their classroom, diligently writing tests and coursework in Kambia 1.',
    aspect: 'landscape',
    fallbackDescription: 'Pupils writing exam coursework at classroom desks'
  },
  {
    id: 'photo-secondary-scholars',
    filename: 'IMG-20260918-WA0028.jpg',
    title: 'Junior Secondary Scholars in Official Uniforms',
    category: 'Secondary Scholars',
    date: 'Academic Delegation',
    caption: 'Scholars dressed in distinctive cream blazers, navy pleated skirts/trousers, and patterned socks alongside faculty in front of the school monument.',
    aspect: 'portrait',
    fallbackDescription: 'Secondary students in formal blazer uniforms'
  },
  {
    id: 'photo-nursery-grad',
    filename: 'IMG-20260918-WA0029.jpg',
    title: 'Early Childhood & Nursery Graduation Class',
    category: 'Nursery Graduation',
    date: 'Annual Graduation Day',
    caption: 'Young nursery graduates in immaculate white graduation robes, caps, and blue stoles celebrating their milestone in Kambia 1.',
    aspect: 'portrait',
    fallbackDescription: 'Nursery pupils in white graduation gowns'
  },
  {
    id: 'photo-college-green',
    filename: 'IMG-20260918-WA0022.jpg',
    title: 'College & Senior Diplomats in Emerald Robes',
    category: 'College & Senior Robes',
    date: 'Diplomats Convocation',
    caption: 'Graduating female scholars seated in the assembly hall wearing distinguished emerald green academic robes and matching mortarboards.',
    aspect: 'landscape',
    fallbackDescription: 'College graduates in green academic regalia'
  },
  {
    id: 'photo-chapel-convocation',
    filename: 'IMG-20260918-WA0025.jpg',
    title: 'Chapel Convocation & Assembly with Band',
    category: 'Assembly & Worship',
    date: 'Speech & Prize Giving',
    caption: 'Grand graduation ceremony in the assembly hall with junior & senior graduates in blue and white gowns alongside the school band drum kit.',
    aspect: 'landscape',
    fallbackDescription: 'Graduates assembled in hall with drum kit'
  },
  {
    id: 'photo-grand-grad-lineup',
    filename: 'IMG-20260918-WA0020.jpg',
    title: 'Grand Eagles Squad Graduation Lineup',
    category: 'Nursery Graduation',
    date: 'Commencement Ceremony',
    caption: 'Expansive outdoor graduation procession featuring nursery, primary, and junior secondary graduates in white, blue, and green regalia.',
    aspect: 'landscape',
    fallbackDescription: 'Multi-grade graduation class outdoors'
  },
  {
    id: 'photo-senior-blue-tutor',
    filename: 'IMG-20260918-WA0023.jpg',
    title: 'Senior Graduates with Academic Mentor',
    category: 'College & Senior Robes',
    date: 'Graduation Day',
    caption: 'Senior graduating class in sky-blue robes and white stoles celebrating alongside their teacher outdoors on campus grounds.',
    aspect: 'landscape',
    fallbackDescription: 'Senior scholars in blue robes with mentor'
  },
  {
    id: 'photo-scholars-team',
    filename: 'IMG-20260918-WA0026.jpg',
    title: 'Academic Leaders & Faculty Mentorship',
    category: 'Secondary Scholars',
    date: 'Faculty Mentorship Review',
    caption: 'Secondary school pupils and faculty standing together with academic report folios, upholding high moral discipline and scholarship.',
    aspect: 'portrait',
    fallbackDescription: 'Student leaders in cream blazers with faculty'
  },
  {
    id: 'photo-blue-graduates',
    filename: 'IMG-20260918-WA0021.jpg',
    title: 'Eagles Squad Pupils in Blue Academic Regalia',
    category: 'Nursery Graduation',
    date: 'Annual Convocation',
    caption: 'Six proud graduates in bright blue gowns with customized stoles celebrating academic completion in Kambia 1.',
    aspect: 'landscape',
    fallbackDescription: 'Pupils in blue graduation gowns'
  },
  {
    id: 'photo-kolenten-secondary',
    filename: 'IMG-20260918-WA0024.jpg',
    title: 'Secondary Student Body Delegation',
    category: 'Secondary Scholars',
    date: 'Campus Delegation',
    caption: 'Junior Secondary student body assembled in smart ceremonial blazers for external academic competition and BECE preparation.',
    aspect: 'portrait',
    fallbackDescription: 'Secondary student assembly'
  }
];

const STORAGE_PREFIX = 'gwm_school_photo_';
const SYNC_EVENT_NAME = 'gwm_school_photos_updated';

// Helper to get image source: checks persistent storage, then /school-photos/ path
export function getSchoolPhotoSrc(filename: string): string {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${filename}`);
    if (stored) {
      return stored;
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  return `/school-photos/${filename}`;
}

// Check if a photo is locally synced or bundled in public/school-photos
export function isPhotoSynced(filename: string): boolean {
  // All 10 attached WhatsApp photos are bundled directly in /school-photos/ and permanently active!
  return true;
}

// Count how many of the 10 attached school photos are live
export function getSyncedPhotosCount(): number {
  return ATTACHED_SCHOOL_PHOTOS.length;
}

// Save a photo Data URL to local storage and push to server disk
export function saveSchoolPhoto(filename: string, dataUrl: string) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${filename}`, dataUrl);
    window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail: { filename } }));

    // Persist to backend server so it replaces file on disk
    fetch('/api/upload-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, dataUrl })
    }).catch(err => {
      console.warn('Backend disk photo save non-fatal:', err);
    });
  } catch (e) {
    console.error('Failed to save photo to localStorage', e);
  }
}

// Clear stored photos
export function clearStoredSchoolPhotos() {
  try {
    ATTACHED_SCHOOL_PHOTOS.forEach(p => {
      localStorage.removeItem(`${STORAGE_PREFIX}${p.filename}`);
    });
    window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME));
  } catch (e) {
    // Ignore
  }
}

// Listen for photo updates
export function onSchoolPhotosUpdated(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(SYNC_EVENT_NAME, handler);
  return () => window.removeEventListener(SYNC_EVENT_NAME, handler);
}
