'use client';
import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
export function BackToTop() {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > 400);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    if (!visible)
        {return null;}
    return (<button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity" aria-label="Back to top">
      <ArrowUp className="h-4 w-4"/>
    </button>);
}
