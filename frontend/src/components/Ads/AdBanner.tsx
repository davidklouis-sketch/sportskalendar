import React from 'react';

interface AdBannerProps {
  slotId: string;
  style?: React.CSSProperties;
  className?: string;
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
}

export function AdBanner({ slotId, style, className, format = 'auto' }: AdBannerProps) {
  const defaultStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    height: 'auto',
    minHeight: '90px',
    ...style
  };

  // Zeige Platzhalter wenn keine AdMob Client ID konfiguriert ist
  if (!import.meta.env.VITE_ADMOB_CLIENT_ID || import.meta.env.VITE_ADMOB_CLIENT_ID === 'ca-pub-xxxxxxxxxxxxxxxx') {
    return (
      <div 
        className={`bg-gray-200 dark:bg-gray-700 border-2 border-dashed border-gray-400 dark:border-gray-500 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm ${className || ''}`}
        style={defaultStyle}
      >
        <div className="text-center p-4">
          <div className="text-lg mb-2">📢</div>
          <div>Ad Banner Platzhalter</div>
          <div className="text-xs mt-1">Slot: {slotId}</div>
          <div className="text-xs mt-1 text-red-500">⚠️ AdMob Client ID nicht konfiguriert</div>
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
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
