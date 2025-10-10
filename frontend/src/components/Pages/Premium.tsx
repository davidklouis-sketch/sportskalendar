import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { stripeApi } from '../../lib/api';
import { SEOHead } from '../SEO/SEOHead';

interface PremiumProps {
  onNavigate: (page: 'calendar' | 'live' | 'highlights' | 'premium' | 'admin' | 'settings' | 'privacy' | 'contact') => void;
}

export function Premium({ }: PremiumProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    console.log('🔍 Premium upgrade attempt:', { isAuthenticated, user });
    
    if (!isAuthenticated) {
      setError('Bitte melde dich zuerst an, um Premium zu aktivieren.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Creating checkout session...');
      const response = await stripeApi.createCheckoutSession();
      console.log('✅ Checkout session response:', response);
      
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        setError('Fehler beim Erstellen der Checkout-Session');
      }
    } catch (error: any) {
      console.error('❌ Premium upgrade error:', error);
      console.error('❌ Error response:', error.response?.data);
      setError(error.response?.data?.message || 'Fehler beim Upgrade zu Premium');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      title: 'Werbefreie Erfahrung',
      description: 'Genieße die App ohne störende Werbung',
      icon: '🚫'
    },
    {
      title: 'Erweiterte Statistiken',
      description: 'Detaillierte Analysen und Trends',
      icon: '📊'
    },
    {
      title: 'Prioritäts-Support',
      description: 'Schnellere Antworten auf deine Anfragen',
      icon: '⚡'
    },
    {
      title: 'Exklusive Features',
      description: 'Früher Zugang zu neuen Funktionen',
      icon: '🎯'
    },
    {
      title: 'Erweiterte Kalender-Features',
      description: 'Mehr Teams, bessere Synchronisation',
      icon: '📅'
    },
    {
      title: 'Premium-Highlights',
      description: 'Exklusive Videos und Analysen',
      icon: '🎬'
    }
  ];

  return (
    <>
      <SEOHead
        title="Premium - Sportskalendar"
        description="Upgrade zu Sportskalendar Premium und genieße eine werbefreie Erfahrung mit erweiterten Features."
        keywords="Premium, Sportskalendar, Werbefrei, Upgrade, Features"
        canonical="https://sportskalendar.de/premium"
      />
      
      <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            ⭐ Premium
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Upgrade zu Sportskalendar Premium und genieße alle Vorteile
          </p>
        </div>

        {/* Current Status */}
        <div className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="text-4xl">
              {user?.isPremium ? '👑' : '⭐'}
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user?.isPremium ? 'Du bist bereits Premium!' : 'Aktueller Status: Standard'}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {user?.isPremium 
                  ? 'Genieße alle Premium-Features' 
                  : 'Upgrade jetzt für nur 9,99€/Monat'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 mb-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              Premium für nur 9,99€/Monat
            </h2>
            <div className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              9,99€
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Jederzeit kündbar • Keine versteckten Kosten • Sofort aktiv
            </p>
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {!user?.isPremium && (
              <button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Wird verarbeitet...</span>
                  </div>
                ) : (
                  'Jetzt upgraden ⭐'
                )}
              </button>
            )}

            {user?.isPremium && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-2xl">🎉</span>
                  <h3 className="text-xl font-semibold text-green-800 dark:text-green-200">
                    Premium aktiv!
                  </h3>
                </div>
                <p className="text-green-700 dark:text-green-300">
                  Du genießt bereits alle Premium-Features. Vielen Dank für deine Unterstützung!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
            Häufige Fragen
          </h2>
          <div className="space-y-4">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Kann ich Premium jederzeit kündigen?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Ja, du kannst dein Premium-Abonnement jederzeit in den Einstellungen kündigen.
              </p>
            </div>
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Wird mein Premium sofort aktiv?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Ja, nach erfolgreicher Zahlung hast du sofort Zugang zu allen Premium-Features.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Welche Zahlungsmethoden werden akzeptiert?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Wir akzeptieren alle gängigen Kreditkarten über unseren sicheren Stripe-Payment-Provider.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}