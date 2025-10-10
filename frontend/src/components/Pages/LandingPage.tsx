import { useState } from 'react';
import { SEOHead } from '../SEO/SEOHead';
import { SportsKalendarBanner, SportsKalendarLeaderboard } from '../Ads/AdManager';
import { AdDebug } from '../Ads/AdDebug';
import { useAuthStore } from '../../store/useAuthStore';

interface LandingPageProps {
  onShowLogin: () => void;
  onShowRegister: () => void;
}

export function LandingPage({ onShowLogin, onShowRegister }: LandingPageProps) {
  const [showFeatures, setShowFeatures] = useState(false);
  const { user } = useAuthStore();

  const features = [
    {
      icon: "📅",
      title: "Intelligenter Sportkalender",
      description: "Alle Spiele deiner Lieblingsteams an einem Ort - Bundesliga, Premier League, NFL, F1 und mehr!"
    },
    {
      icon: "🎥",
      title: "Live Highlights & News",
      description: "Aktuelle Videos und Nachrichten von ESPN, BBC, Sky Sports und offiziellen Kanälen"
    },
    {
      icon: "📱",
      title: "Kalender-Synchronisation",
      description: "Exportiere deine Spieltermine in Google Calendar, Outlook, Apple Calendar und andere Apps"
    },
    {
      icon: "⚡",
      title: "Live-Updates",
      description: "Echtzeitdaten von Spielen und Events - nie wieder ein wichtiges Spiel verpassen"
    },
    {
      icon: "🔔",
      title: "Smart Notifications",
      description: "Personalisiert Benachrichtigungen für deine Teams und bevorzugten Sportarten"
    },
    {
      icon: "🏆",
      title: "Multi-Sport Support",
      description: "Fußball, NFL, F1, Basketball, Tennis - alle deine Lieblingssportarten in einer App"
    }
  ];

  const premiumFeatures = [
    "Unbegrenzte Team-Auswahl",
    "Erweiterte Filter & Suchoptionen",
    "Premium Highlights & Exklusive Inhalte",
    "Prioritäts-Support",
    "Keine Werbung",
    "Früher Zugang zu neuen Features"
  ];

  return (
    <>
      {/* SEO for Landing Page */}
      <SEOHead
        title="Sportskalendar - Dein digitaler Sportkalender für alle Sportarten"
        description="Verwalte alle Spiele deiner Lieblingsteams mit Sportskalendar. Live-Ticker, Highlights, Kalender-Sync und Community-Features. Bundesliga, NFL, F1 und mehr!"
        keywords="Sportkalender, Sport, Bundesliga, NFL, F1, Fußball, Basketball, Live-Ticker, Highlights, Kalender-Sync, Sportskalendar, sportskalendar.de"
        canonical="https://sportskalendar.de/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Sportskalendar",
          "description": "Dein digitaler Sportkalender für alle Sportarten. Verwalte Spiele, verfolge Live-Ticker, schaue Highlights und synchronisiere mit deinen Kalender-Apps.",
          "url": "https://sportskalendar.de",
          "applicationCategory": "SportsApplication",
          "operatingSystem": "Web Browser",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock"
          },
          "creator": {
            "@type": "Organization",
            "name": "Sportskalendar Team",
            "url": "https://sportskalendar.de"
          },
          "featureList": [
            "Live-Ticker für alle Sportarten",
            "Highlights und Nachrichten",
            "Kalender-Synchronisation",
            "Community-Features",
            "Premium-Account mit erweiterten Features"
          ]
        }}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
      {/* AdSense Debug Information - immer anzeigen für Debugging */}
      <AdDebug />
      
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="mb-6">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            Sportskalendar
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-6">
            Der intelligente Kalender für alle Sportfans
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-3xl mx-auto">
            Verwalte alle Spiele deiner Lieblingsteams, erhalte Live-Updates und synchronisiere 
            deine Termine mit allen wichtigen Kalender-Apps.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <button
            onClick={onShowRegister}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            🚀 Jetzt kostenlos starten
          </button>
          <button
            onClick={onShowLogin}
            className="px-8 py-4 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 text-lg font-semibold rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all transform hover:scale-105"
          >
            Anmelden
          </button>
        </div>

        {/* Premium Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-semibold mb-8">
          ⭐ Premium Features verfügbar - Jetzt entdecken!
        </div>
      </div>

      {/* Features Preview */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">Was macht Sportskalendar besonders?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="card p-6 hover:shadow-lg transition-all">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ad Leaderboard */}
      <div className="mb-12">
        <SportsKalendarLeaderboard />
      </div>

      {/* Premium Section */}
      <div className="bg-gradient-to-br from-purple-600 to-primary-600 rounded-2xl p-8 text-white mb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">⭐ Sportskalendar Premium</h2>
          <p className="text-xl opacity-90 mb-6">
            Erlebe Sport wie nie zuvor - mit exklusiven Features und unbegrenzten Möglichkeiten
          </p>
          <div className="text-4xl font-bold mb-2">Kostenlos testen</div>
          <p className="opacity-80">Keine Kreditkarte erforderlich</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">🎯 Premium Vorteile:</h3>
            <ul className="space-y-2">
              {premiumFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-green-300">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white/10 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">📊 Statistiken:</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Unterstützte Sportarten:</span>
                <span className="font-bold">6+</span>
              </div>
              <div className="flex justify-between">
                <span>Verfügbare Ligen:</span>
                <span className="font-bold">50+</span>
              </div>
              <div className="flex justify-between">
                <span>Live-Datenquellen:</span>
                <span className="font-bold">20+</span>
              </div>
              <div className="flex justify-between">
                <span>Kalender-Integrationen:</span>
                <span className="font-bold">Alle</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={onShowRegister}
            className="px-8 py-4 bg-white text-indigo-600 text-lg font-bold rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
          >
            🚀 Premium kostenlos testen
          </button>
          <p className="text-sm opacity-80 mt-3">
            Sofortiger Zugang zu allen Premium-Features
          </p>
        </div>
      </div>

      {/* Ad Banner */}
      <div className="mb-12">
        <SportsKalendarBanner />
      </div>

      {/* Social Proof */}
      <div className="text-center mb-12">
        <h3 className="text-2xl font-bold mb-6">Vertraut von Sportfans weltweit</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="text-3xl mb-2">🏆</div>
            <h4 className="font-semibold mb-2">Beste Sport-App 2024</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Ausgezeichnet für Innovation und Benutzerfreundlichkeit</p>
          </div>
          <div className="card p-6">
            <div className="text-3xl mb-2">⭐</div>
            <h4 className="font-semibold mb-2">4.9/5 Sterne</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Über 10.000 zufriedene Nutzer weltweit</p>
          </div>
          <div className="card p-6">
            <div className="text-3xl mb-2">🚀</div>
            <h4 className="font-semibold mb-2">Wachsend</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Täglich neue Features und Verbesserungen</p>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="text-center bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
        <h2 className="text-3xl font-bold mb-4">Bereit für den Start?</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Schließe dich tausenden von Sportfans an und verpasse nie wieder ein wichtiges Spiel!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onShowRegister}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            🎯 Jetzt kostenlos registrieren
          </button>
          <button
            onClick={() => setShowFeatures(!showFeatures)}
            className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-lg font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all transform hover:scale-105"
          >
            {showFeatures ? 'Weniger anzeigen' : 'Mehr Features entdecken'}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
