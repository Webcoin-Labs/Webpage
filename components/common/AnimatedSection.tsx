"use client";

import { motion, useInView } from "framer-motion";
import { useRef, ReactNode } from "react";

interface AnimatedSectionProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    direction?: "up" | "down" | "left" | "right" | "none";
}

export function AnimatedSection({
    children,
    className,
    delay = 0,
    direction = "up",
}: AnimatedSectionProps) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-80px" });

    const directionMap = {
        up: { y: 40, x: 0 },
        down: { y: -40, x: 0 },
        left: { y: 0, x: 40 },
        right: { y: 0, x: -40 },
        none: { y: 0, x: 0 },
    };

    const initial = { opacity: 0, ...directionMap[direction] };
    const animate = inView ? { opacity: 1, y: 0, x: 0 } : initial;

    return (
        <motion.div
            ref={ref}
            initial={initial}
            animate={animate}
            transition={{
                duration: 0.6,
                delay,
                ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
