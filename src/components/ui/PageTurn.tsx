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
        initial={{ rotateY: -110, opacity: 0, x: "20%" }}
        animate={{ rotateY: 0, opacity: 1, x: 0 }}
        exit={{ rotateY: 110, opacity: 0, x: "-20%" }}
        transition={{ 
          duration: 0.7, 
          ease: [0.4, 0, 0.2, 1], // Custom cubic-bezier for a physical "paper" feel
        }}
        style={{ transformOrigin: "right center", perspective: "2000px" }}
        className="w-full h-full bg-background relative overflow-hidden"
      >
        <div className="border-r-4 border-foreground/5 pr-4 h-full">
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTurn;
