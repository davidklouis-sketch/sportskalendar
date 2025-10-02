import { useState, useEffect } from 'react';
import { SecureAPI } from '../utils/security';

interface TwoFactorSetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export function TwoFactorSetup() {
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');

  useEffect(() => {
    initializeSetup();
  }, []);

  const initializeSetup = async () => {
    try {
      setIsLoading(true);
      const response = await SecureAPI.request('/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSetupData(data.setup);
        setStep('verify');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to initialize 2FA setup');
      }
    } catch (error) {
      console.error('2FA setup error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationToken || verificationToken.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      const response = await SecureAPI.request('/auth/2fa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: verificationToken
        })
      });

      if (response.ok) {
        setSuccess(true);
        setStep('complete');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = () => {
    if (setupData?.backupCodes) {
      navigator.clipboard.writeText(setupData.backupCodes.join('\n'));
      alert('Backup codes copied to clipboard');
    }
  };

  if (isLoading && step === 'setup') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px'
      }}>
        <div style={{
          fontSize: '18px',
          color: '#6b7280'
        }}>
          Initializing 2FA setup...
        </div>
      </div>
    );
  }

  if (step === 'verify' && setupData) {
    return (
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        padding: '2rem',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Enable Two-Factor Authentication
        </h2>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Step 1: Scan QR Code</h3>
          <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
            Use your authenticator app (Google Authenticator, Authy, etc.) to scan this QR code:
          </p>
          <div style={{ textAlign: 'center' }}>
            <img 
              src={setupData.qrCodeUrl} 
              alt="2FA QR Code"
              style={{
                maxWidth: '200px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Step 2: Enter Verification Code</h3>
          <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
            Enter the 6-digit code from your authenticator app:
          </p>
          
          <form onSubmit={handleVerification}>
            <input
              type="text"
              value={verificationToken}
              onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '1.5rem',
                textAlign: 'center',
                letterSpacing: '0.5rem',
                fontFamily: 'monospace'
              }}
              maxLength={6}
              required
            />
            
            {error && (
              <div style={{
                color: '#dc2626',
                fontSize: '0.875rem',
                marginTop: '0.5rem',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || verificationToken.length !== 6}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: isLoading || verificationToken.length !== 6 ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: isLoading || verificationToken.length !== 6 ? 'not-allowed' : 'pointer',
                marginTop: '1rem'
              }}
            >
              {isLoading ? 'Verifying...' : 'Enable 2FA'}
            </button>
          </form>
        </div>

        <div style={{
          background: '#f3f4f6',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          <h4 style={{ marginBottom: '0.5rem' }}>Backup Codes</h4>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Save these backup codes in a safe place. You can use them to access your account if you lose your device:
          </p>
          <div style={{
            background: 'white',
            padding: '0.5rem',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            border: '1px solid #d1d5db'
          }}>
            {setupData.backupCodes.map((code, index) => (
              <div key={index} style={{ marginBottom: '0.25rem' }}>
                {code}
              </div>
            ))}
          </div>
          <button
            onClick={copyBackupCodes}
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Copy Backup Codes
          </button>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div style={{
        maxWidth: '400px',
        margin: '0 auto',
        padding: '2rem',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '1rem'
        }}>
          ✅
        </div>
        <h2 style={{ marginBottom: '1rem', color: '#10b981' }}>
          Two-Factor Authentication Enabled!
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          Your account is now protected with two-factor authentication. You'll need to enter a code from your authenticator app when logging in.
        </p>
        <button
          onClick={() => window.location.href = '/dashboard'}
          style={{
            padding: '0.75rem 2rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          Continue to Dashboard
        </button>
      </div>
    );
  }

  return null;
}

