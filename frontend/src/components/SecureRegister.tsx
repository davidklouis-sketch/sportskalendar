import { useState, useEffect } from 'react';
import { validatePasswordStrength, validateEmail, sanitizeInput, SecureAPI, CSRFManager } from '../utils/security';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

interface RegisterErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  displayName?: string;
  general?: string;
}

export function SecureRegister() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });

  useEffect(() => {
    // Fetch CSRF token
    CSRFManager.fetchToken();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));

    // Clear errors when user starts typing
    if (errors[name as keyof RegisterErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }

    // Check password strength in real-time
    if (name === 'password') {
      const strength = validatePasswordStrength(sanitizedValue);
      setPasswordStrength(strength);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: RegisterErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Display name validation
    if (!formData.displayName) {
      newErrors.displayName = 'Display name is required';
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters long';
    } else if (formData.displayName.length > 50) {
      newErrors.displayName = 'Display name must be no more than 50 characters long';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordStrength.isValid) {
      newErrors.password = 'Password does not meet security requirements';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await SecureAPI.request('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          displayName: formData.displayName.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Registration successful:', data);
        
        // Redirect to login or show success message
        alert('Registration successful! Please log in with your new account.');
        window.location.href = '/login';
      } else {
        const errorData = await response.json();
        setErrors({ general: errorData.message || 'Registration failed. Please try again.' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score < 2) return '#dc2626'; // Red
    if (score < 4) return '#f59e0b'; // Yellow
    return '#10b981'; // Green
  };

  const getPasswordStrengthText = (score: number) => {
    if (score < 2) return 'Weak';
    if (score < 4) return 'Medium';
    return 'Strong';
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: '2rem',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Create Account</h2>
      
      {errors.general && (
        <div style={{
          background: '#fee2e2',
          color: '#dc2626',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="displayName" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Display Name
          </label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            value={formData.displayName}
            onChange={handleInputChange}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${errors.displayName ? '#dc2626' : '#d1d5db'}`,
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            autoComplete="name"
            required
          />
          {errors.displayName && (
            <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {errors.displayName}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${errors.email ? '#dc2626' : '#d1d5db'}`,
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            autoComplete="email"
            required
          />
          {errors.email && (
            <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {errors.email}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${errors.password ? '#dc2626' : '#d1d5db'}`,
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            autoComplete="new-password"
            required
          />
          
          {/* Password strength indicator */}
          {formData.password && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.25rem'
              }}>
                <div style={{
                  width: '100px',
                  height: '4px',
                  background: '#e5e7eb',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(passwordStrength.score / 5) * 100}%`,
                    height: '100%',
                    background: getPasswordStrengthColor(passwordStrength.score),
                    transition: 'all 0.3s ease'
                  }} />
                </div>
                <span style={{
                  fontSize: '0.875rem',
                  color: getPasswordStrengthColor(passwordStrength.score),
                  fontWeight: '500'
                }}>
                  {getPasswordStrengthText(passwordStrength.score)}
                </span>
              </div>
              
              {passwordStrength.feedback.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {passwordStrength.feedback.map((feedback, index) => (
                    <div key={index}>• {feedback}</div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {errors.password && (
            <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {errors.password}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${errors.confirmPassword ? '#dc2626' : '#d1d5db'}`,
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            autoComplete="new-password"
            required
          />
          {errors.confirmPassword && (
            <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {errors.confirmPassword}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !passwordStrength.isValid}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: isLoading || !passwordStrength.isValid ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: isLoading || !passwordStrength.isValid ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <span style={{ color: '#6b7280' }}>Already have an account? </span>
        <a href="/login" style={{ color: '#3b82f6', textDecoration: 'none' }}>
          Sign in
        </a>
      </div>
    </div>
  );
}

