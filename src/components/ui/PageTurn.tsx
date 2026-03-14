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
        initial={{ rotateY: 90, opacity: 0, scale: 0.95 }}
        animate={{ rotateY: 0, opacity: 1, scale: 1 }}
        exit={{ rotateY: -90, opacity: 0, scale: 0.95 }}
        transition={{ 
          duration: 0.4, 
          ease: "easeInOut",
          type: "spring",
          stiffness: 100,
          damping: 20
        }}
        style={{ transformOrigin: "left center", perspective: "1200px" }}
        className="w-full h-full bg-background"
      >
        <div className="border-l-4 border-foreground/10 pl-4 h-full">
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTurn;
