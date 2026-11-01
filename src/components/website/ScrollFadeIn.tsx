/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode } from 'react';
import { motion, MotionProps } from 'motion/react';

interface ScrollFadeInProps extends MotionProps {
  children: ReactNode;
  key?: React.Key;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
  threshold?: number;
}

export default function ScrollFadeIn({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  duration = 0.55,
  threshold = 0.15,
  ...rest
}: ScrollFadeInProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up':
        return { opacity: 0, y: 28 };
      case 'down':
        return { opacity: 0, y: -28 };
      case 'left':
        return { opacity: 0, x: 28 };
      case 'right':
        return { opacity: 0, x: -28 };
      case 'none':
      default:
        return { opacity: 0 };
    }
  };

  const getTargetPosition = () => {
    switch (direction) {
      case 'up':
      case 'down':
        return { opacity: 1, y: 0 };
      case 'left':
      case 'right':
        return { opacity: 1, x: 0 };
      case 'none':
      default:
        return { opacity: 1 };
    }
  };

  return (
    <motion.div
      initial={getInitialPosition()}
      whileInView={getTargetPosition()}
      viewport={{ once: true, amount: threshold, margin: '0px 0px -40px 0px' }}
      transition={{
        duration,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98]
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
