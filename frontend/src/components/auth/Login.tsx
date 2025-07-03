import React, { useState } from 'react';
import { login, resendVerificationEmail } from '../../services/api';
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
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

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
      const errorDetail = err.response?.data?.detail || '로그인 중 오류가 발생했습니다.';
      
      // 이메일 인증이 필요한 경우 (403 Forbidden)
      if (err.response?.status === 403 && err.response?.headers?.['x-email-verification-required']) {
        setVerificationEmail(email);
        setShowEmailVerification(true);
        setError('');
      } else {
        setError(errorDetail);
      }
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

  const handleResendVerification = async () => {
    if (!verificationEmail) return;

    try {
      await resendVerificationEmail({ email: verificationEmail });
      alert('인증 이메일을 재발송했습니다. 이메일을 확인해주세요.');
    } catch (err: any) {
      console.error('Resend verification error:', err);
      setError('인증 이메일 재발송 중 오류가 발생했습니다.');
    }
  };

  if (showEmailVerification) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">이메일 인증 필요</h2>
          <p className="auth-subtitle">
            로그인하려면 이메일 인증이 필요합니다.<br />
            <strong>{verificationEmail}</strong>으로 발송된 인증 이메일을 확인해주세요.
          </p>
          
          <div className="verification-info">
            <p>📧 이메일이 오지 않았나요?</p>
            <ul>
              <li>스팸 폴더를 확인해보세요</li>
              <li>이메일 주소가 정확한지 확인해보세요</li>
              <li>아래 버튼으로 인증 이메일을 재발송할 수 있습니다</li>
            </ul>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="verification-actions">
            <button
              type="button"
              className="auth-button"
              onClick={handleResendVerification}
            >
              인증 이메일 재발송
            </button>
          </div>

          <div className="auth-footer">
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setShowEmailVerification(false);
                setVerificationEmail('');
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
