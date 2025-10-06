import { useState, useEffect } from 'react';
import { validatePasswordStrength, validateEmail, sanitizeInput, SecureAPI, CSRFManager } from '../utils/security';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

export function SecureLogin() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  const maxAttempts = 5;
  const lockoutDuration = 15 * 60 * 1000; // 15 minutes

  useEffect(() => {
    // Check for existing lockout
    const storedLockout = localStorage.getItem('loginLockout');
    if (storedLockout) {
      const lockoutEnd = parseInt(storedLockout);
      if (Date.now() < lockoutEnd) {
        setIsLocked(true);
        setLockoutTime(lockoutEnd);
      } else {
        localStorage.removeItem('loginLockout');
      }
    }

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
    if (errors[name as keyof LoginErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      const remainingTime = Math.ceil((lockoutTime - Date.now()) / 1000 / 60);
      setErrors({ general: `Account locked. Try again in ${remainingTime} minutes.` });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await SecureAPI.request('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          password: formData.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);
        
        // Reset login attempts
        setLoginAttempts(0);
        localStorage.removeItem('loginAttempts');
        
        // Redirect or update app state
        window.location.href = '/dashboard';
      } else {
        const errorData = await response.json();
        
        if (response.status === 401) {
          const newAttempts = loginAttempts + 1;
          setLoginAttempts(newAttempts);
          localStorage.setItem('loginAttempts', newAttempts.toString());
          
          if (newAttempts >= maxAttempts) {
            const lockoutEnd = Date.now() + lockoutDuration;
            setIsLocked(true);
            setLockoutTime(lockoutEnd);
            localStorage.setItem('loginLockout', lockoutEnd.toString());
            setErrors({ general: 'Too many failed attempts. Account locked for 15 minutes.' });
          } else {
            setErrors({ 
              general: `Invalid credentials. ${maxAttempts - newAttempts} attempts remaining.` 
            });
          }
        } else {
          setErrors({ general: errorData.message || 'Login failed. Please try again.' });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const remainingLockoutTime = isLocked ? Math.ceil((lockoutTime - Date.now()) / 1000 / 60) : 0;

  return (
    <div style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: '2rem',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Secure Login</h2>
      
      {isLocked && (
        <div style={{
          background: '#fee2e2',
          color: '#dc2626',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          Account locked. Try again in {remainingLockoutTime} minutes.
        </div>
      )}

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
          <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={isLoading || isLocked}
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

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            disabled={isLoading || isLocked}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${errors.password ? '#dc2626' : '#d1d5db'}`,
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            autoComplete="current-password"
            required
          />
          {errors.password && (
            <div style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {errors.password}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || isLocked}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: isLoading || isLocked ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: isLoading || isLocked ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <a href="/forgot-password" style={{ color: '#3b82f6', textDecoration: 'none' }}>
          Forgot your password?
        </a>
      </div>
    </div>
  );
}






