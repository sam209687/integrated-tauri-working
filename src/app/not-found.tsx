// src/app/not-found.tsx
"use client";

import Link from 'next/link';
import { NavControls } from '@/components/ui/TauriNavControls';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground relative overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              x: [null, Math.random() * window.innerWidth],
              scale: [null, Math.random() * 0.5 + 0.5],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Animated 404 Number */}
        <div className="flex items-center justify-center mb-8">
          <motion.h1
            className="text-9xl font-extrabold text-red-600 tracking-widest"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              duration: 1,
            }}
          >
            4
          </motion.h1>
          
          {/* Animated Zero with Rotation */}
          <motion.div
            className="relative mx-4"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <motion.h1
              className="text-9xl font-extrabold text-red-600 tracking-widest"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2,
              }}
            >
              0
            </motion.h1>
            
            {/* Orbiting Icon */}
            <motion.div
              className="absolute top-1/2 left-1/2"
              animate={{
                rotate: -360,
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Search className="w-8 h-8 text-primary -translate-x-20 -translate-y-4" />
            </motion.div>
          </motion.div>
          
          <motion.h1
            className="text-9xl font-extrabold text-red-600 tracking-widest"
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.4,
              duration: 1,
            }}
          >
            4
          </motion.h1>
        </div>
        
        {/* Animated Banner */}
        <motion.div
          className="bg-primary px-4 py-2 text-sm rounded rotate-12 mb-8 text-primary-foreground shadow-lg"
          initial={{ y: -100, opacity: 0, rotate: 0 }}
          animate={{ y: 0, opacity: 1, rotate: 12 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.6,
          }}
          whileHover={{
            rotate: -12,
            scale: 1.1,
          }}
        >
          Page Not Found
        </motion.div>
        
        {/* Main Text with Fade and Slide */}
        <motion.p
          className="text-2xl font-medium text-foreground text-center px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          Oops! The page you are looking for does not exist.
        </motion.p>
        
        {/* Sub Text with Stagger */}
        <motion.p
          className="text-lg text-muted-foreground mt-2 text-center px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          It might have been moved or deleted.
        </motion.p>

        {/* Animated Suggestion Text */}
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <motion.p
            className="text-sm text-muted-foreground"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Let's get you back on track →
          </motion.p>
        </motion.div>

        {/* Navigation Controls */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.4, duration: 0.5 }}
        >
          <NavControls />
        </motion.div>

        {/* Animated Buttons */}
        <motion.div
          className="flex gap-4 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.5 }}
        >
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="py-4 px-6 gap-2">
                <Home className="w-4 h-4" />
                Return to Dashboard
              </Button>
            </motion.div>
          </Link>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="outline" 
              className="py-4 px-6 gap-2"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          </motion.div>
        </motion.div>

        {/* Floating Decorative Elements */}
        <motion.div
          className="absolute -z-10"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        </motion.div>
        
        <motion.div
          className="absolute -z-10 right-20 top-20"
          animate={{
            y: [0, 20, 0],
            rotate: [0, -5, 5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        >
          <div className="w-24 h-24 bg-red-500/10 rounded-full blur-2xl" />
        </motion.div>
      </div>

      {/* Bottom Wave Animation */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none">
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-full bg-linear-to-t from-primary/5 to-transparent"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </div>
  );
}