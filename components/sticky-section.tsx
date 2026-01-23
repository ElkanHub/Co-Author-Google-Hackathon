import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface StickySectionProps {
    children: React.ReactNode;
    className?: string;
}

export const StickySection: React.FC<StickySectionProps> = ({ children, className = "" }) => {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.9, 1], [0, 1, 1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2, 0.9, 1], [0.95, 1, 1, 0.95]);

    return (
        <motion.div
            ref={ref}
            style={{ opacity, scale }}
            className={`min-h-screen flex items-center justify-center py-24 ${className}`}
        >
            {children}
        </motion.div>
    );
};