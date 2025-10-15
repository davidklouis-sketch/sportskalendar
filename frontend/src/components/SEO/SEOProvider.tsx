import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import ModernSEO from './ModernSEO';
import { generateDynamicSEO, type SEOConfig } from './SEOConfig';

interface SEOContextType {
  updateSEO: (page: string, user?: any, dynamicContent?: any) => void;
  currentConfig: SEOConfig | null;
}

const SEOContext = createContext<SEOContextType | undefined>(undefined);

export function useSEO() {
  const context = useContext(SEOContext);
  if (!context) {
    throw new Error('useSEO must be used within an SEOProvider');
  }
  return context;
}

interface SEOProviderProps {
  children: React.ReactNode;
}

export function SEOProvider({ children }: SEOProviderProps) {
  const [currentConfig, setCurrentConfig] = useState<SEOConfig | null>(null);

  const updateSEO = useCallback((page: string, user?: any, dynamicContent?: any) => {
    const config = generateDynamicSEO(page, user, dynamicContent);
    setCurrentConfig(config);
  }, []);

  // Performance optimization: Only re-render SEO when config actually changes
  const lastConfigHashRef = useRef<string>('');

  useEffect(() => {
    if (!currentConfig) return;

    const configHash = JSON.stringify({
      title: currentConfig.title,
      description: currentConfig.description,
      canonical: currentConfig.canonical,
      ogImage: currentConfig.ogImage,
      structuredData: currentConfig.structuredData
    });

    if (configHash !== lastConfigHashRef.current) {
      lastConfigHashRef.current = configHash;
    }
  }, [currentConfig]);

  return (
    <SEOContext.Provider value={{ updateSEO, currentConfig }}>
      {children}
      {currentConfig && (
        <ModernSEO
          title={currentConfig.title}
          description={currentConfig.description}
          keywords={currentConfig.keywords}
          canonical={currentConfig.canonical}
          ogImage={currentConfig.ogImage}
          ogType={currentConfig.ogType}
          structuredData={currentConfig.structuredData}
          noIndex={currentConfig.noIndex}
        />
      )}
    </SEOContext.Provider>
  );
}

export default SEOProvider;
