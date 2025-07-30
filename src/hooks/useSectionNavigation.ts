'use client';

import { useState, useEffect, useRef } from 'react';

export interface Section {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function useSectionNavigation(sections: Section[]) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || '');
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Intersection Observer to track active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        threshold: [0.1, 0.5, 0.9],
        rootMargin: '-20% 0px -20% 0px',
      }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sections]);

  return {
    activeSection,
    setActiveSection,
    scrollToSection,
    contentRef,
  };
} 