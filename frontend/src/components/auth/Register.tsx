import React, { useState } from 'react';
import { registerUser } from '../../services/api';
import './Auth.css';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  displayName: string;
}

interface RegisterProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    displayName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호는 필수입니다.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }

    if (formData.password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return false;
    }

    if (!/[A-Za-z]/.test(formData.password)) {
      setError('비밀번호에는 최소 하나의 영문자가 포함되어야 합니다.');
      return false;
    }

    if (!/\d/.test(formData.password)) {
      setError('비밀번호에는 최소 하나의 숫자가 포함되어야 합니다.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('올바른 이메일 주소를 입력해주세요.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await registerUser({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName || undefined,
        display_name: formData.displayName || undefined
      });
      
      onSuccess();
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">회원가입</h2>
        <p className="auth-subtitle">NONGBUX에 오신 것을 환영합니다</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">이메일 *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="form-input"
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">전체 이름</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="form-input"
              placeholder="홍길동"
            />
          </div>

          <div className="form-group">
            <label className="form-label">표시 이름</label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              className="form-input"
              placeholder="길동이"
            />
          </div>

          <div className="form-group">
            <label className="form-label">비밀번호 *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="form-input"
              placeholder="최소 8자, 영문자와 숫자 포함"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">비밀번호 확인 *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="form-input"
              placeholder="비밀번호를 다시 입력하세요"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner">⏳</span>
            ) : (
              '회원가입'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            이미 계정이 있으신가요?{' '}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToLogin}
            >
              로그인
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 