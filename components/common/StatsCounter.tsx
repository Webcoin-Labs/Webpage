"use client";

import { useState, useEffect, useRef } from "react";

interface StatsCounterProps {
    value: number;
    suffix?: string;
    className?: string;
}

export function StatsCounter({ value, suffix = "", className }: StatsCounterProps) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    let start = 0;
                    const duration = 2000;
                    const step = (value / duration) * 16;

                    const timer = setInterval(() => {
                        start += step;
                        if (start >= value) {
                            setCount(value);
                            clearInterval(timer);
                        } else {
                            setCount(Math.floor(start));
                        }
                    }, 16);
                }
            },
            { threshold: 0.5 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [value]);

    return (
        <div ref={ref} className={className}>
            <span className="text-3xl font-black gradient-text">
                {count.toLocaleString()}{suffix}
            </span>
        </div>
    );
}
