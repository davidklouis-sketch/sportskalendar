import React, { useEffect } from 'react';

interface AdSquareProps {
  slotId: string;
  style?: React.CSSProperties;
  className?: string;
}

export function AdSquare({ slotId, style, className }: AdSquareProps) {
  const defaultStyle: React.CSSProperties = {
    display: 'block',
    width: '300px',
    height: '250px',
    margin: '0 auto',
    ...style
  };

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense initialization error:', error);
    }
  }, []);

  // Zeige Platzhalter wenn keine AdSense Publisher ID konfiguriert ist
  if (!import.meta.env.VITE_ADMOB_CLIENT_ID || import.meta.env.VITE_ADMOB_CLIENT_ID === 'ca-pub-xxxxxxxxxxxxxxxx') {
    return (
      <div 
        className={`bg-gray-200 dark:bg-gray-700 border-2 border-dashed border-gray-400 dark:border-gray-500 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm ${className || ''}`}
        style={defaultStyle}
      >
        <div className="text-center p-4">
          <div className="text-lg mb-2">📦</div>
          <div>Ad Square Platzhalter</div>
          <div className="text-xs mt-1">Slot: {slotId}</div>
          <div className="text-xs mt-1 text-red-500">⚠️ AdSense Publisher ID nicht konfiguriert</div>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={defaultStyle}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={import.meta.env.VITE_ADMOB_CLIENT_ID}
        data-ad-slot={slotId}
        data-ad-format="rectangle"
        data-full-width-responsive="false"
      />
    </div>
  );
}
