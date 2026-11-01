/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface PageTransitionProps {
  children: React.ReactNode;
  pageKey: string;
  className?: string;
}

export default function PageTransition({ children, pageKey, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      key={pageKey}
      initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -16, filter: 'blur(4px)' }}
      transition={{ 
        duration: 0.3, 
        ease: [0.22, 1, 0.36, 1] 
      }}
      className={`w-full ${className}`}
    >
      {children}
    </motion.div>
  );
}
