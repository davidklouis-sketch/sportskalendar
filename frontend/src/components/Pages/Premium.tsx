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
          <h1 className="text-4xl md:text-6xl font-bold mb-4 heading-sport">
            ⭐ PREMIUM
          </h1>
          <p className="text-xl text-lime-400 mb-8">
            Upgrade zu Sportskalendar Premium und genieße alle Vorteile
          </p>
        </div>

        {/* Current Status */}
        <div className="card-sport p-6 mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="text-4xl">
              {user?.isPremium ? '👑' : '⭐'}
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">
                {user?.isPremium ? 'Du bist bereits Premium!' : 'Aktueller Status: Standard'}
              </h2>
              <p className="text-cyan-400">
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
            <div key={index} className="card hover:shadow-2xl transition-all duration-300">
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-white">
                {feature.title}
              </h3>
              <p className="text-dark-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="card p-8 mb-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4 text-white">
              Premium für nur 9,99€/Monat
            </h2>
            <div className="text-6xl font-bold mb-4 heading-sport">
              9,99€
            </div>
            <p className="text-cyan-400 mb-8">
              Jederzeit kündbar • Keine versteckten Kosten • Sofort aktiv
            </p>
            
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {!user?.isPremium && (
              <button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="btn btn-orange text-lg px-8 py-4"
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
              <div className="bg-lime-500/10 border border-lime-500/30 rounded-lg p-6">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-2xl">🎉</span>
                  <h3 className="text-xl font-semibold text-lime-400">
                    Premium aktiv!
                  </h3>
                </div>
                <p className="text-lime-300">
                  Du genießt bereits alle Premium-Features. Vielen Dank für deine Unterstützung!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="card p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">
            Häufige Fragen
          </h2>
          <div className="space-y-4">
            <div className="border-b border-dark-600 pb-4">
              <h3 className="font-semibold text-white">
                Kann ich Premium jederzeit kündigen?
              </h3>
              <p className="text-dark-300 mt-1">
                Ja, du kannst dein Premium-Abonnement jederzeit in den Einstellungen kündigen.
              </p>
            </div>
            <div className="border-b border-dark-600 pb-4">
              <h3 className="font-semibold text-white">
                Wird mein Premium sofort aktiv?
              </h3>
              <p className="text-dark-300 mt-1">
                Ja, nach erfolgreicher Zahlung hast du sofort Zugang zu allen Premium-Features.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">
                Welche Zahlungsmethoden werden akzeptiert?
              </h3>
              <p className="text-dark-300 mt-1">
                Wir akzeptieren alle gängigen Kreditkarten über unseren sicheren Stripe-Payment-Provider.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}