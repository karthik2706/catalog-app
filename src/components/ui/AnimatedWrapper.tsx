'use client'

import React from 'react'
import { motion, Variants } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AnimatedWrapperProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
  distance?: number
}

const directionVariants: Record<string, Variants> = {
  up: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  },
  down: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 }
  },
  left: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 }
  },
  right: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }
}

export const AnimatedWrapper: React.FC<AnimatedWrapperProps> = ({
  children,
  className,
  delay = 0,
  duration = 0.5,
  direction = 'up',
  distance = 20
}) => {
  const variants = directionVariants[direction]
  
  if (direction !== 'fade') {
    variants.hidden = {
      ...variants.hidden,
      [direction === 'up' || direction === 'down' ? 'y' : 'x']: direction === 'up' || direction === 'left' ? distance : -distance
    }
  }

  return (
    <motion.div
      className={cn(className)}
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{
        duration,
        delay,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  )
}

export const StaggerWrapper: React.FC<{
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}> = ({ children, className, staggerDelay = 0.1 }) => {
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children}
    </motion.div>
  )
}

export const FadeIn: React.FC<{
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
}> = ({ children, className, delay = 0, duration = 0.5 }) => {
  return (
    <AnimatedWrapper
      className={className}
      direction="fade"
      delay={delay}
      duration={duration}
    >
      {children}
    </AnimatedWrapper>
  )
}

export const SlideUp: React.FC<{
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  distance?: number
}> = ({ children, className, delay = 0, duration = 0.5, distance = 20 }) => {
  return (
    <AnimatedWrapper
      className={className}
      direction="up"
      delay={delay}
      duration={duration}
      distance={distance}
    >
      {children}
    </AnimatedWrapper>
  )
}

export const SlideLeft: React.FC<{
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  distance?: number
}> = ({ children, className, delay = 0, duration = 0.5, distance = 20 }) => {
  return (
    <AnimatedWrapper
      className={className}
      direction="left"
      delay={delay}
      duration={duration}
      distance={distance}
    >
      {children}
    </AnimatedWrapper>
  )
}

export const SlideRight: React.FC<{
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  distance?: number
}> = ({ children, className, delay = 0, duration = 0.5, distance = 20 }) => {
  return (
    <AnimatedWrapper
      className={className}
      direction="right"
      delay={delay}
      duration={duration}
      distance={distance}
    >
      {children}
    </AnimatedWrapper>
  )
}

export const ScaleIn: React.FC<{
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
}> = ({ children, className, delay = 0, duration = 0.3 }) => {
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration,
        delay,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  )
}

export const HoverScale: React.FC<{
  children: React.ReactNode
  className?: string
  scale?: number
}> = ({ children, className, scale = 1.05 }) => {
  return (
    <motion.div
      className={cn(className)}
      whileHover={{ scale }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

export const Pulse: React.FC<{
  children: React.ReactNode
  className?: string
  duration?: number
}> = ({ children, className, duration = 2 }) => {
  return (
    <motion.div
      className={cn(className)}
      animate={{ scale: [1, 1.05, 1] }}
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
