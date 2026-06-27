import React from 'react';
import { Calendar, Shield, Globe, ShieldAlert, Award, Clock } from 'lucide-react';

interface DomainCardProps {
  whois: any;
  ssl: any;
}

export const DomainCard: React.FC<DomainCardProps> = ({ whois, ssl }) => {
  const isWhoisAvailable = whois && !whois.error && whois.domain_age_days !== -1;
  const isSslAvailable = ssl && !ssl.error && ssl.cert_age_days !== -1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* WHOIS Panel */}
      <div className="bg-card border border-border-card rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-border-card pb-3">
            <Globe className="w-5 h-5 text-accent-blue" />
            <h3 className="text-base font-semibold text-text-primary font-sans">
              WHOIS Domain Forensics
            </h3>
          </div>

          {!isWhoisAvailable ? (
            <div className="py-8 text-center text-text-muted text-xs">
              {whois?.error || 'WHOIS registry details unavailable.'}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Row 1: Age */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-text-muted" />
                  Domain Age
                </span>
                <span className="font-mono text-text-primary">
                  {whois.domain_age_days} days
                  {whois.domain_age_days < 30 && (
                    <span className="ml-2 text-[10px] font-bold text-phish-red bg-phish-red/10 border border-phish-red/25 px-2 py-0.5 rounded-full uppercase">
                      New Domain
                    </span>
                  )}
                </span>
              </div>

              {/* Row 2: Registrar */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-text-muted" />
                  Registrar
                </span>
                <span className="font-mono text-text-primary truncate max-w-[200px]" title={whois.registrar}>
                  {whois.registrar || 'Unknown'}
                </span>
              </div>

              {/* Row 3: Country */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-text-muted" />
                  Registrant Country
                </span>
                <span className="font-mono text-text-primary">
                  {whois.country || 'Unknown'}
                </span>
              </div>

              {/* Row 4: Dates */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                  Created Date
                </span>
                <span className="font-mono text-text-primary">
                  {whois.registered_date ? whois.registered_date.split('T')[0] : 'Unknown'}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                  Expiry Date
                </span>
                <span className="font-mono text-text-primary">
                  {whois.expiry_date ? whois.expiry_date.split('T')[0] : 'Unknown'}
                  {whois.domain_expiry_days > 0 && whois.domain_expiry_days < 90 && (
                    <span className="ml-2 text-[10px] text-suspicious-amber bg-suspicious-amber/10 border border-suspicious-amber/25 px-2 py-0.5 rounded-full uppercase">
                      Expiring Soon
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SSL Panel */}
      <div className="bg-card border border-border-card rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-border-card pb-3">
            <Shield className="w-5 h-5 text-accent-blue" />
            <h3 className="text-base font-semibold text-text-primary font-sans">
              SSL/TLS Certificate Integrity
            </h3>
          </div>

          {!isSslAvailable ? (
            <div className="py-8 text-center text-text-muted text-xs">
              {ssl?.error || 'No active SSL/TLS certificate found on server.'}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Row 1: Self-signed Check */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-text-muted" />
                  Certificate Trust
                </span>
                <span className="font-mono text-text-primary">
                  {ssl.is_self_signed || ssl.ssl_is_self_signed === 1 ? (
                    <span className="text-phish-red bg-phish-red/10 border border-phish-red/25 px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] tracking-wide">
                      Self-Signed (Untrusted)
                    </span>
                  ) : (
                    <span className="text-safe-green bg-safe-green/10 border border-safe-green/25 px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] tracking-wide">
                      Trusted Certificate
                    </span>
                  )}
                </span>
              </div>

              {/* Row 2: Issuer */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-text-muted" />
                  Certificate Authority
                </span>
                <span className="font-mono text-text-primary truncate max-w-[200px]" title={ssl.issuer}>
                  {ssl.issuer || 'Unknown'}
                </span>
              </div>

              {/* Row 3: Certificate Age */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-text-muted" />
                  Certificate Age
                </span>
                <span className="font-mono text-text-primary">
                  {ssl.cert_age_days} days
                  {ssl.cert_age_days < 7 && (
                    <span className="ml-2 text-[10px] font-bold text-phish-red bg-phish-red/10 border border-phish-red/25 px-2 py-0.5 rounded-full uppercase">
                      New Cert
                    </span>
                  )}
                </span>
              </div>

              {/* Row 4: Dates */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                  Valid From
                </span>
                <span className="font-mono text-text-primary">
                  {ssl.issued_date ? ssl.issued_date.split('T')[0] : 'Unknown'}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                  Valid Until
                </span>
                <span className="font-mono text-text-primary">
                  {ssl.expiry_date ? ssl.expiry_date.split('T')[0] : 'Unknown'}
                  {ssl.days_until_expiry > 0 && ssl.days_until_expiry < 30 && (
                    <span className="ml-2 text-[10px] text-phish-red bg-phish-red/10 border border-phish-red/25 px-2 py-0.5 rounded-full uppercase animate-pulse">
                      Expires Soon
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
