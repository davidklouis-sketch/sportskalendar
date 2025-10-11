import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { stripeApi } from '../../lib/api';
import { SEOHead } from '../SEO/SEOHead';
import { t, getCurrentLanguage } from '../../lib/i18n';
import { useLanguage } from '../../hooks/useLanguage';

interface PremiumProps {
  onNavigate: (page: 'calendar' | 'live' | 'highlights' | 'premium' | 'admin' | 'settings' | 'privacy' | 'contact') => void;
}

export function Premium({ }: PremiumProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useLanguage(); // Trigger re-render on language change

  const handleUpgrade = async () => {
    console.log('🔍 Premium upgrade attempt:', { isAuthenticated, user });
    
    if (!isAuthenticated) {
      setError(getCurrentLanguage() === 'de' 
        ? 'Bitte melde dich zuerst an, um Premium zu aktivieren.'
        : 'Please log in first to activate Premium.'
      );
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
        setError(getCurrentLanguage() === 'de' 
          ? 'Fehler beim Erstellen der Checkout-Session'
          : 'Error creating checkout session'
        );
      }
    } catch (error: any) {
      console.error('❌ Premium upgrade error:', error);
      console.error('❌ Error response:', error.response?.data);
      setError(error.response?.data?.message || (getCurrentLanguage() === 'de' 
        ? 'Fehler beim Upgrade zu Premium'
        : 'Error upgrading to Premium'
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      title: t('adFreeExperience'),
      description: getCurrentLanguage() === 'de' 
        ? 'Genieße die App ohne störende Werbung'
        : 'Enjoy the app without annoying ads',
      icon: '🚫'
    },
    {
      title: t('advancedStatistics'),
      description: getCurrentLanguage() === 'de' 
        ? 'Detaillierte Analysen und Trends'
        : 'Detailed analyses and trends',
      icon: '📊'
    },
    {
      title: t('prioritySupport'),
      description: getCurrentLanguage() === 'de' 
        ? 'Schnellere Antworten auf deine Anfragen'
        : 'Faster responses to your requests',
      icon: '⚡'
    },
    {
      title: t('exclusiveFeatures'),
      description: getCurrentLanguage() === 'de' 
        ? 'Früher Zugang zu neuen Funktionen'
        : 'Early access to new features',
      icon: '🎯'
    },
    {
      title: t('extendedCalendarFeatures'),
      description: getCurrentLanguage() === 'de' 
        ? 'Mehr Teams, bessere Synchronisation'
        : 'More teams, better synchronization',
      icon: '📅'
    },
    {
      title: t('premiumHighlights'),
      description: getCurrentLanguage() === 'de' 
        ? 'Exklusive Videos und Analysen'
        : 'Exclusive videos and analyses',
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
            {getCurrentLanguage() === 'de' 
              ? 'Upgrade zu Sportskalendar Premium und genieße alle Vorteile'
              : 'Upgrade to Sportskalendar Premium and enjoy all benefits'
            }
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
                {user?.isPremium 
                  ? (getCurrentLanguage() === 'de' ? 'Du bist bereits Premium!' : 'You are already Premium!')
                  : (getCurrentLanguage() === 'de' ? 'Aktueller Status: Standard' : 'Current Status: Standard')
                }
              </h2>
              <p className="text-cyan-400">
                {user?.isPremium 
                  ? (getCurrentLanguage() === 'de' ? 'Genieße alle Premium-Features' : 'Enjoy all Premium features')
                  : (getCurrentLanguage() === 'de' ? 'Upgrade jetzt für nur 9,99€/Monat' : 'Upgrade now for only €9.99/month')
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
              {getCurrentLanguage() === 'de' 
                ? 'Premium für nur 9,99€/Monat'
                : 'Premium for only €9.99/month'
              }
            </h2>
            <div className="text-6xl font-bold mb-4 heading-sport">
              9,99€
            </div>
            <p className="text-cyan-400 mb-8">
              {getCurrentLanguage() === 'de' 
                ? 'Jederzeit kündbar • Keine versteckten Kosten • Sofort aktiv'
                : 'Cancel anytime • No hidden costs • Instant activation'
              }
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
                    <span>{getCurrentLanguage() === 'de' ? 'Wird verarbeitet...' : 'Processing...'}</span>
                  </div>
                ) : (
                  getCurrentLanguage() === 'de' ? 'Jetzt upgraden ⭐' : 'Upgrade now ⭐'
                )}
              </button>
            )}

            {user?.isPremium && (
              <div className="bg-lime-500/10 border border-lime-500/30 rounded-lg p-6">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-2xl">🎉</span>
                  <h3 className="text-xl font-semibold text-lime-400">
                    {getCurrentLanguage() === 'de' ? 'Premium aktiv!' : 'Premium active!'}
                  </h3>
                </div>
                <p className="text-lime-300">
                  {getCurrentLanguage() === 'de' 
                    ? 'Du genießt bereits alle Premium-Features. Vielen Dank für deine Unterstützung!'
                    : 'You already enjoy all Premium features. Thank you for your support!'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="card p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">
            {getCurrentLanguage() === 'de' ? 'Häufige Fragen' : 'Frequently Asked Questions'}
          </h2>
          <div className="space-y-4">
            <div className="border-b border-dark-600 pb-4">
              <h3 className="font-semibold text-white">
                {getCurrentLanguage() === 'de' 
                  ? 'Kann ich Premium jederzeit kündigen?'
                  : 'Can I cancel Premium anytime?'
                }
              </h3>
              <p className="text-dark-300 mt-1">
                {getCurrentLanguage() === 'de' 
                  ? 'Ja, du kannst dein Premium-Abonnement jederzeit in den Einstellungen kündigen.'
                  : 'Yes, you can cancel your Premium subscription anytime in the settings.'
                }
              </p>
            </div>
            <div className="border-b border-dark-600 pb-4">
              <h3 className="font-semibold text-white">
                {getCurrentLanguage() === 'de' 
                  ? 'Wird mein Premium sofort aktiv?'
                  : 'Is my Premium activated immediately?'
                }
              </h3>
              <p className="text-dark-300 mt-1">
                {getCurrentLanguage() === 'de' 
                  ? 'Ja, nach erfolgreicher Zahlung hast du sofort Zugang zu allen Premium-Features.'
                  : 'Yes, after successful payment you have immediate access to all Premium features.'
                }
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">
                {getCurrentLanguage() === 'de' 
                  ? 'Welche Zahlungsmethoden werden akzeptiert?'
                  : 'Which payment methods are accepted?'
                }
              </h3>
              <p className="text-dark-300 mt-1">
                {getCurrentLanguage() === 'de' 
                  ? 'Wir akzeptieren alle gängigen Kreditkarten über unseren sicheren Stripe-Payment-Provider.'
                  : 'We accept all major credit cards through our secure Stripe payment provider.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}