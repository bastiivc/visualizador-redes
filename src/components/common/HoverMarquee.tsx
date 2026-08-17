"use client";

import { useState, useRef } from "react";

interface HoverMarqueeProps {
  text: string;
  className?: string;
}

export default function HoverMarquee({ text, className = "" }: HoverMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [scrollDistance, setScrollDistance] = useState(0);

  const handleMouseEnter = () => {
    if (containerRef.current && textRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const textWidth = textRef.current.scrollWidth;
      if (textWidth > containerWidth) {
        setScrollDistance(textWidth - containerWidth + 16);
      }
    }
  };

  const handleMouseLeave = () => {
    setScrollDistance(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`overflow-hidden whitespace-nowrap relative ${className}`}
      title={text}
    >
      <span
        ref={textRef}
        className="inline-block transition-transform duration-1000 ease-in-out"
        style={{
          transform: scrollDistance > 0 ? `translateX(-${scrollDistance}px)` : "translateX(0px)",
        }}
      >
        {text}
      </span>
    </div>
  );
}
