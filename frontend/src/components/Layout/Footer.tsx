import React from 'react';

interface FooterProps {
  onNavigate: (page: 'privacy' | 'contact') => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Copyright */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} SportsKalender. Alle Rechte vorbehalten.
          </div>

          {/* Footer Links */}
          <div className="flex items-center gap-6 text-sm">
            <button
              onClick={() => onNavigate('privacy')}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Datenschutz
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Kontakt
            </button>
            <a
              href="mailto:david.louis@protonmail.com"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Support
            </a>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-400 dark:text-gray-500 text-center">
            <p>
              SportsKalender - Ihr persönlicher Sportkalender für Fußball, NFL und F1.
              <br />
              Daten werden sicher und DSGVO-konform verarbeitet.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
