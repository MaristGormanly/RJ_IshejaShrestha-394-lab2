import { useEffect } from 'react';

const useScrollAnimation = () => {
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const handleIntersect = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // If it's a stats container, also animate its children
          if (entry.target.classList.contains('stats-container')) {
            entry.target.querySelectorAll('.stat-card').forEach(card => {
              card.classList.add('is-visible');
            });
          }
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    // Observe all elements with animation classes
    document.querySelectorAll('.fade-up, .stagger-children, .stats-container, .stat-card').forEach(element => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, []);
};

export default useScrollAnimation; 