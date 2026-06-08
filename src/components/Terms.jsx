import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="p-8 max-w-4xl mx-auto animate-slide-in">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/" className="btn-secondary px-3 py-2 flex items-center gap-2">
          <ArrowLeft size={16} /> Zurück
        </Link>
        <h2 className="text-2xl font-bold flex items-center gap-2 text-accent">
          <ShieldAlert size={24} /> Nutzungsbedingungen & Rechtliche Hinweise
        </h2>
      </div>

      <div className="glass-panel p-8 space-y-6 text-sm text-muted">
        <section>
          <h3 className="text-lg font-semibold text-primary mb-2">1. Allgemeine Hinweise</h3>
          <p>
            Diese Anwendung ("Routenplanungsapp") wird im aktuellen Zustand ("as is") zur Verfügung gestellt. 
            Der Entwickler ("ZaboChris") übernimmt keine Gewähr für die ständige Verfügbarkeit, Zuverlässigkeit, 
            Vollständigkeit oder Richtigkeit der durch die App berechneten Routen und Zeitangaben.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-primary mb-2">2. Haftungsausschluss (Disclaimer)</h3>
          <p className="mb-2">
            Die Nutzung der generierten Routen erfolgt auf eigene Gefahr. Der Entwickler haftet nicht für 
            direkte oder indirekte Schäden, Verzögerungen, Verdienstausfälle oder sonstige wirtschaftliche 
            Verluste, die durch die Nutzung der Anwendung, fehlerhafte Routenführung oder Ausfälle der 
            integrierten APIs (z.B. OpenRouteService, OpenStreetMap) entstehen.
          </p>
          <p>
            Die Fahrer sind ausdrücklich dazu angehalten, sich an die geltende Straßenverkehrsordnung (StVO) 
            zu halten und die Verkehrslage vor Ort selbst zu beurteilen. Die App ersetzt kein offizielles Navigationsgerät.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-primary mb-2">3. Drittanbieter-APIs & Kosten</h3>
          <p>
            Die App nutzt externe Dienste (APIs) wie OpenRouteService zur Berechnung von Fahrtzeiten und Distanzen. 
            Die Nutzung dieser Dienste erfordert teilweise einen eigenen API-Schlüssel, für dessen Sicherheit und 
            Nutzungskontingente der jeweilige Nutzer selbst verantwortlich ist. Der Entwickler übernimmt keine 
            Kosten für API-Nutzungsüberschreitungen oder Sperrungen von Drittanbieter-Accounts.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-primary mb-2">4. Datenschutz und Vertraulichkeit</h3>
          <p className="mb-2">
            Die App verarbeitet Adressdaten, die vom Nutzer hochgeladen werden. Der Nutzer versichert, dass er 
            berechtigt ist, die hochgeladenen Kundendaten (Namen, Adressen, Debitorennummern) zu diesem Zweck 
            zu verarbeiten und verpflichtet sich zur Einhaltung der geltenden Datenschutzbestimmungen (z.B. DSGVO).
          </p>
          <p>
            Routendaten werden lokal im Browser des Nutzers (LocalStorage) sowie nach explizitem Speichern in 
            einer cloudbasierten Datenbank (Supabase) abgelegt. Der Entwickler übernimmt keine Haftung für 
            Datenverlust oder unbefugten Zugriff durch Dritte auf Endgeräte der Nutzer.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-primary mb-2">5. Administratorenrechte</h3>
          <p>
            Nutzer mit Administrationsrechten verpflichten sich, die ihnen übertragenen Zugriffsrechte (z.B. auf 
            Nutzerprofile und gespeicherte Routen) ausschließlich für den vom Unternehmen vorgesehenen Zweck zu nutzen. 
            Missbrauch von Administratorenrechten kann zum sofortigen Entzug der Nutzungsberechtigung führen.
          </p>
        </section>
        
        <div className="mt-8 pt-4 border-t border-gray-700/50 text-xs">
          <p>Letzte Aktualisierung: Juni 2026</p>
        </div>
      </div>
    </div>
  );
}
