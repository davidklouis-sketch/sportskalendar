import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { stripeApi } from '../../lib/api';

export function Premium() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [premiumFeatures, setPremiumFeatures] = useState<any>(null);

  useEffect(() => {
    const loadPremiumFeatures = async () => {
      try {
        const { data } = await stripeApi.getPremiumFeatures();
        setPremiumFeatures(data);
      } catch (error) {
        console.error('Failed to load premium features:', error);
      }
    };

    loadPremiumFeatures();
  }, []);

  const handleUpgrade = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data } = await stripeApi.createCheckoutSession();
      
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      alert('Fehler beim Erstellen der Zahlungssitzung. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.isPremium) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⭐</span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Willkommen bei Premium!
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Du genießt bereits alle Premium-Features von Sportskalendar.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {premiumFeatures?.features.map((feature: string, index: number) => (
              <div key={index} className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-800 dark:text-green-200 font-medium">{feature}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              🎉 Premium-Account aktiv
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300">
              Vielen Dank für deine Unterstützung! Du hast Zugang zu allen erweiterten Features.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Upgrade zu <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Premium</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Entdecke alle erweiterten Features und genieße die beste Sportskalendar-Erfahrung
        </p>
      </div>

      {/* Pricing Card */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Premium Plan</h2>
            <div className="text-6xl font-bold text-white mb-2">
              {premiumFeatures?.price?.formatted || '€9.99'}
            </div>
            <p className="text-yellow-100">pro Monat</p>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {premiumFeatures?.features.map((feature: string, index: number) => (
                <div key={index} className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                  Wird verarbeitet...
                </div>
              ) : (
                'Jetzt upgraden'
              )}
            </button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              Sichere Zahlung über Stripe • Jederzeit kündbar
            </p>
          </div>
        </div>
      </div>

      {/* Features Comparison */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="card p-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Free Plan</h3>
          <ul className="space-y-3">
            <li className="flex items-center">
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600 dark:text-gray-400">1 Team auswählen</span>
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600 dark:text-gray-400">Basis-Kalender</span>
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600 dark:text-gray-400">Community-Support</span>
            </li>
          </ul>
        </div>

        <div className="card p-6 border-2 border-yellow-400">
          <div className="flex items-center mb-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Premium Plan</h3>
            <span className="ml-3 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
              Empfohlen
            </span>
          </div>
          <ul className="space-y-3">
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">Unbegrenzte Teams</span>
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">Erweiterte Features</span>
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">Prioritäts-Support</span>
            </li>
          </ul>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="card p-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Häufig gestellte Fragen
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Kann ich jederzeit kündigen?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Ja, du kannst dein Premium-Abonnement jederzeit in deinen Einstellungen kündigen.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Wie funktioniert die Zahlung?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Wir verwenden Stripe für sichere Zahlungen. Deine Kreditkartendaten werden sicher verarbeitet.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Bekomme ich eine Rechnung?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Ja, du erhältst eine E-Mail-Rechnung nach jeder erfolgreichen Zahlung.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Sind alle Features sofort verfügbar?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Ja, nach der erfolgreichen Zahlung hast du sofort Zugang zu allen Premium-Features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
