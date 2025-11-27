import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

export function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center space-y-4">
        {/* Animated Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [0.8, 1.1, 1],
            opacity: [0, 1, 1]
          }}
          transition={{
            duration: 0.6,
            ease: "easeOut"
          }}
        >
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <BarChart3 className="w-16 h-16 text-primary" />
          </motion.div>
        </motion.div>

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Loading Dashboard
          </h2>
          <p className="text-sm text-muted-foreground">
            Fetching your data...
          </p>
        </motion.div>

        {/* Animated Dots */}
        <div className="flex space-x-2">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-3 h-3 bg-primary rounded-full"
              initial={{ opacity: 0.3 }}
              animate={{ 
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <motion.div
          className="w-64 h-1 bg-secondary rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

// Alternative: Simpler Spinner Loading
export function DashboardLoadingSimple() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <motion.div
        className="relative w-20 h-20"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <motion.div
          className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </div>
  );
}

// Alternative: Pulse Loading
export function DashboardLoadingPulse() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center space-y-6">
        <motion.div
          className="w-20 h-20 bg-primary rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="flex items-center justify-center h-full">
            <BarChart3 className="w-10 h-10 text-primary-foreground" />
          </div>
        </motion.div>
        <motion.p
          className="text-lg font-medium text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Loading Dashboard...
        </motion.p>
      </div>
    </div>
  );
}