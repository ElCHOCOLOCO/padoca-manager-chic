import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface PageTurnProps {
  children: ReactNode;
  pageKey: string;
}

const PageTurn = ({ children, pageKey }: PageTurnProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial={{ 
          rotateY: -45, 
          skewY: 5,
          opacity: 0, 
          x: "30%",
          scale: 0.95
        }}
        animate={{ 
          rotateY: 0, 
          skewY: 0,
          opacity: 1, 
          x: 0,
          scale: 1
        }}
        exit={{ 
          rotateY: 45, 
          skewY: -5,
          opacity: 0, 
          x: "-30%",
          scale: 0.95
        }}
        transition={{ 
          duration: 0.8, 
          ease: [0.23, 1, 0.32, 1], // Smooth deceleration
        }}
        style={{ 
          transformOrigin: "right center", 
          perspective: "1200px",
          transformStyle: "preserve-3d"
        }}
        className="w-full h-full bg-background relative"
      >
        {/* Shadow Overlay to simulate the "bend" depth */}
        <motion.div 
          className="absolute inset-0 pointer-events-none z-10"
          initial={{ background: "linear-gradient(to right, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 100%)" }}
          animate={{ background: "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 100%)" }}
          exit={{ background: "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 100%)" }}
          transition={{ duration: 0.8 }}
        />
        
        <div className="h-full">
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTurn;
