import { useState } from 'react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    privacy: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.privacy) {
      alert('Bitte stimmen Sie der Datenschutzerklärung zu.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // In einer echten Anwendung würde hier eine API-Anfrage stehen
      // Für Demo-Zwecke simulieren wir eine erfolgreiche Übermittlung
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '', privacy: false });
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Kontakt & Impressum
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Kontaktformular */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Kontaktformular
              </h2>
              
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-300 rounded-lg">
                  <p>Vielen Dank! Ihre Nachricht wurde erfolgreich übermittelt.</p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded-lg">
                  <p>Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt per E-Mail.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ihr Name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    E-Mail-Adresse *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="ihre@email.de"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Betreff *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Betreff Ihrer Nachricht"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nachricht *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ihre Nachricht..."
                  />
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="privacy"
                    name="privacy"
                    required
                    checked={formData.privacy}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label htmlFor="privacy" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Ich habe die{' '}
                    <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                      Datenschutzerklärung
                    </a>{' '}
                    gelesen und stimme der Verarbeitung meiner Daten zu. *
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {isSubmitting ? 'Wird gesendet...' : 'Nachricht senden'}
                </button>
              </form>
            </div>

            {/* Impressum & Kontaktdaten */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Impressum
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Anbieter
                  </h3>
                  <div className="text-gray-600 dark:text-gray-300 space-y-2">
                    <p><strong>SportsKalender</strong></p>
                    <p>E-Mail: sportskalendar@outlook.de</p>
                    <p>Website: https://sportskalendar.de</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Verantwortlich für den Inhalt
                  </h3>
                  <div className="text-gray-600 dark:text-gray-300">
                    <p>David Louis</p>
                    <p>E-Mail: sportskalendar@outlook.de</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Technische Umsetzung
                  </h3>
                  <div className="text-gray-600 dark:text-gray-300 space-y-2">
                    <p><strong>Frontend:</strong> React, TypeScript, Tailwind CSS</p>
                    <p><strong>Backend:</strong> Node.js, Express, PostgreSQL</p>
                    <p><strong>Hosting:</strong> Docker, Traefik, Let's Encrypt</p>
                    <p><strong>APIs:</strong> Football-Data.org, API-Football, Jolpica F1</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Haftungsausschluss
                  </h3>
                  <div className="text-gray-600 dark:text-gray-300 text-sm space-y-2">
                    <p>
                      Die Inhalte dieser Website werden mit größtmöglicher Sorgfalt erstellt. 
                      Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann 
                      jedoch keine Gewähr übernommen werden.
                    </p>
                    <p>
                      Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte 
                      auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Urheberrecht
                  </h3>
                  <div className="text-gray-600 dark:text-gray-300 text-sm">
                    <p>
                      Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen 
                      Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, 
                      Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der 
                      Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des 
                      jeweiligen Autors bzw. Erstellers.
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Direkter Kontakt
                  </h3>
                  <div className="space-y-3">
                    <a
                      href="mailto:sportskalendar@outlook.de"
                      className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      sportskalendar@outlook.de
                    </a>
                    <a
                      href="/privacy"
                      className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Datenschutzerklärung
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
