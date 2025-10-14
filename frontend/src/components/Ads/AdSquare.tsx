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
      // AdSense initialization error
    }
  }, []);

  // AdSense Client ID aus Environment Variable oder Fallback
  const clientId = import.meta.env.VITE_ADMOB_CLIENT_ID || 'ca-pub-2481184858901580';
  

  return (
    <div className={className} style={defaultStyle}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="rectangle"
        data-full-width-responsive="false"
      />
    </div>
  );
}
