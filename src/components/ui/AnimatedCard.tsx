'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { cn } from '@/lib/utils'

interface AnimatedCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
  distance?: number
  scale?: number
  interactive?: boolean
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className,
  hover = true,
  delay = 0,
  duration = 0.5,
  direction = 'up',
  distance = 20,
  scale = 1.02,
  interactive = false
}) => {
  const getInitialProps = () => {
    switch (direction) {
      case 'up':
        return { opacity: 0, y: distance }
      case 'down':
        return { opacity: 0, y: -distance }
      case 'left':
        return { opacity: 0, x: distance }
      case 'right':
        return { opacity: 0, x: -distance }
      case 'fade':
        return { opacity: 0 }
      default:
        return { opacity: 0, y: distance }
    }
  }

  return (
    <motion.div
      className={cn(className)}
      initial={getInitialProps()}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        duration,
        delay,
        ease: "easeOut"
      }}
      whileHover={hover ? {
        scale: scale,
        y: -4,
        transition: { duration: 0.2 }
      } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
    >
      {children}
    </motion.div>
  )
}

export const AnimatedCardContent: React.FC<{
  children: React.ReactNode
  className?: string
  delay?: number
  stagger?: boolean
}> = ({ children, className, delay = 0, stagger = false }) => {
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        staggerChildren: stagger ? 0.1 : 0
      }}
    >
      {children}
    </motion.div>
  )
}

export const FloatingCard: React.FC<{
  children: React.ReactNode
  className?: string
  intensity?: number
  duration?: number
}> = ({ children, className, intensity = 0.1, duration = 3 }) => {
  return (
    <motion.div
      className={cn(className)}
      animate={{
        y: [0, -intensity * 10, 0],
        rotateX: [0, intensity * 2, 0],
        rotateY: [0, intensity * 1, 0]
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  )
}

export const TiltCard: React.FC<{
  children: React.ReactNode
  className?: string
  intensity?: number
}> = ({ children, className, intensity = 0.1 }) => {
  return (
    <motion.div
      className={cn(className)}
      whileHover={{
        rotateX: 5,
        rotateY: 5,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      style={{
        transformStyle: "preserve-3d"
      }}
    >
      {children}
    </motion.div>
  )
}

export const ShimmerCard: React.FC<{
  children: React.ReactNode
  className?: string
  shimmer?: boolean
}> = ({ children, className, shimmer = true }) => {
  return (
    <motion.div
      className={cn('relative overflow-hidden', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {children}
      {shimmer && (
        <motion.div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{
            translateX: ['100%', '100%']
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}
    </motion.div>
  )
}
