import React, { useState } from 'react';
import { login } from '../../services/api';
import './Auth.css';

interface LoginProps {
  onLogin: (user: any) => void;
  onSwitchToRegister?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await login({ username: email, password });
      
      // Store token and user data
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      onLogin(response.user);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotEmail) {
      setError('이메일을 입력해주세요.');
      return;
    }

    try {
      // TODO: Implement forgot password API call
      // await requestPasswordReset({ email: forgotEmail });
      alert('비밀번호 재설정 이메일을 발송했습니다. (구현 예정)');
      setShowForgotPassword(false);
      setForgotEmail('');
    } catch (err: any) {
      setError('비밀번호 재설정 요청 중 오류가 발생했습니다.');
    }
  };

  if (showForgotPassword) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">비밀번호 재설정</h2>
          <p className="auth-subtitle">가입한 이메일 주소를 입력해주세요</p>
          
          <form onSubmit={handleForgotPassword} className="auth-form">
            <div className="form-group">
              <label className="form-label">이메일</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="form-input"
                placeholder="your@email.com"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="auth-button">
              재설정 이메일 발송
            </button>
          </form>

          <div className="auth-footer">
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setShowForgotPassword(false);
                setError('');
              }}
            >
              로그인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">로그인</h2>
        <p className="auth-subtitle">NONGBUX에 오신 것을 환영합니다</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="비밀번호를 입력하세요"
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
              '로그인'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <button
              type="button"
              className="link-button"
              onClick={() => setShowForgotPassword(true)}
            >
              비밀번호를 잊으셨나요?
            </button>
          </p>
          
          {onSwitchToRegister && (
            <p>
              계정이 없으신가요?{' '}
              <button
                type="button"
                className="link-button"
                onClick={onSwitchToRegister}
              >
                회원가입
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
