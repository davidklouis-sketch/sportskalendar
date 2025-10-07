import React from 'react';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Datenschutzerklärung
          </h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              <strong>Stand:</strong> {new Date().toLocaleDateString('de-DE')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Verantwortlicher
              </h2>
              <div className="text-gray-600 dark:text-gray-300">
                <p><strong>SportsKalender</strong></p>
                <p>E-Mail: david.louis@protonmail.com</p>
                <p>Website: https://sportskalendar.de</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                2. Allgemeine Hinweise zur Datenverarbeitung
              </h2>
              <div className="text-gray-600 dark:text-gray-300 space-y-4">
                <p>
                  Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen. 
                  Diese Datenschutzerklärung informiert Sie über die Art, den Umfang und 
                  Zweck der Verarbeitung von personenbezogenen Daten auf unserer Website.
                </p>
                <p>
                  <strong>Rechtsgrundlage:</strong> Die Verarbeitung Ihrer Daten erfolgt 
                  auf Grundlage der Datenschutz-Grundverordnung (DSGVO) und des 
                  Bundesdatenschutzgesetzes (BDSG).
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                3. Erhebung und Verarbeitung personenbezogener Daten
              </h2>
              
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                3.1 Registrierung und Benutzerkonto
              </h3>
              <div className="text-gray-600 dark:text-gray-300 space-y-3 mb-6">
                <p><strong>Erhobene Daten:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>E-Mail-Adresse (zur Anmeldung und Kommunikation)</li>
                  <li>Anzeigename (frei wählbar)</li>
                  <li>Passwort (verschlüsselt gespeichert mit bcrypt)</li>
                  <li>Ausgewählte Sportteams (Präferenzen)</li>
                  <li>Premium-Status (Account-Information)</li>
                </ul>
                <p><strong>Zweck:</strong> Bereitstellung der Service-Funktionen, Personalisierung</p>
                <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</p>
                <p><strong>Speicherdauer:</strong> Bis zur Löschung des Benutzerkontos</p>
              </div>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                3.2 Technische Daten
              </h3>
              <div className="text-gray-600 dark:text-gray-300 space-y-3 mb-6">
                <p><strong>Erhobene Daten:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>IP-Adresse (anonymisiert nach 7 Tagen)</li>
                  <li>Browser-Informationen</li>
                  <li>Zugriffszeiten</li>
                  <li>Fehlgeschlagene Anmeldeversuche (Sicherheitslog)</li>
                </ul>
                <p><strong>Zweck:</strong> Sicherheit, Fehlerbehebung, Service-Optimierung</p>
                <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)</p>
                <p><strong>Speicherdauer:</strong> 7 Tage (IP-Adresse), 30 Tage (Logs)</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                4. Cookies und lokale Speicherung
              </h2>
              <div className="text-gray-600 dark:text-gray-300 space-y-4">
                <p><strong>Verwendete Cookies:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Authentifizierungs-Cookies:</strong> HttpOnly, Secure, SameSite=Lax</li>
                  <li><strong>Theme-Präferenz:</strong> Dark/Light Mode Einstellung</li>
                  <li><strong>Keine Tracking-Cookies:</strong> Wir verwenden keine Analytics oder Werbe-Cookies</li>
                </ul>
                <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)</p>
                <p><strong>Widerruf:</strong> Cookies können in den Browser-Einstellungen deaktiviert werden</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Datenübertragung und -speicherung
              </h2>
              <div className="text-gray-600 dark:text-gray-300 space-y-4">
                <p><strong>Sicherheitsmaßnahmen:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>HTTPS-Verschlüsselung (TLS 1.2+)</li>
                  <li>Passwort-Hashing mit bcrypt (12 Rounds)</li>
                  <li>JWT-Token mit kurzer Gültigkeit (15 Min Access, 7 Tage Refresh)</li>
                  <li>Docker-Netzwerk-Isolation</li>
                  <li>Regelmäßige Sicherheitsupdates</li>
                </ul>
                <p><strong>Datenstandort:</strong> Deutschland (Server in der EU)</p>
                <p><strong>Backup:</strong> Tägliche, verschlüsselte Backups</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Ihre Rechte
              </h2>
              <div className="text-gray-600 dark:text-gray-300 space-y-4">
                <p>Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Auskunftsrecht</strong> (Art. 15 DSGVO)</li>
                  <li><strong>Berichtigungsrecht</strong> (Art. 16 DSGVO)</li>
                  <li><strong>Löschungsrecht</strong> (Art. 17 DSGVO)</li>
                  <li><strong>Einschränkung der Verarbeitung</strong> (Art. 18 DSGVO)</li>
                  <li><strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO)</li>
                  <li><strong>Widerspruchsrecht</strong> (Art. 21 DSGVO)</li>
                </ul>
                <p>
                  <strong>Kontakt:</strong> Zur Ausübung Ihrer Rechte wenden Sie sich an: 
                  <a href="mailto:david.louis@protonmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                    david.louis@protonmail.com
                  </a>
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                7. Beschwerderecht
              </h2>
              <div className="text-gray-600 dark:text-gray-300">
                <p>
                  Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über 
                  die Verarbeitung Ihrer personenbezogenen Daten durch uns zu beschweren.
                </p>
                <p className="mt-2">
                  <strong>Zuständige Aufsichtsbehörde:</strong><br />
                  Landesbeauftragte für Datenschutz und Informationsfreiheit<br />
                  [Ihr Bundesland]
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                8. Änderungen der Datenschutzerklärung
              </h2>
              <div className="text-gray-600 dark:text-gray-300">
                <p>
                  Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf zu aktualisieren. 
                  Die aktuelle Version finden Sie stets auf dieser Seite.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                9. Kontakt
              </h2>
              <div className="text-gray-600 dark:text-gray-300">
                <p>Bei Fragen zum Datenschutz kontaktieren Sie uns:</p>
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p><strong>E-Mail:</strong> david.louis@protonmail.com</p>
                  <p><strong>Website:</strong> https://sportskalendar.de</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
