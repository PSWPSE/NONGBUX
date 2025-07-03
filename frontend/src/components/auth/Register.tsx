import React, { useState, useEffect } from 'react';
import { registerUser, checkVerificationStatus, resendVerificationEmail } from '../../services/api';
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
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string>('');
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(false);

  // 자동 인증 상태 확인 (30초마다)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (showEmailVerification && autoCheckEnabled && registeredEmail) {
      intervalId = setInterval(async () => {
        try {
          const response = await checkVerificationStatus(registeredEmail);
          if (response.email_verified) {
            setVerificationMessage('🎉 이메일 인증이 완료되었습니다! 로그인 화면으로 이동합니다.');
            setAutoCheckEnabled(false);
            setTimeout(() => {
              onSuccess();
            }, 2000);
          }
        } catch (error) {
          // 자동 확인 중 에러는 무시 (사용자가 수동으로 확인할 수 있음)
        }
      }, 30000); // 30초마다 확인
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [showEmailVerification, autoCheckEnabled, registeredEmail, onSuccess]);

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
      
      setShowEmailVerification(true);
      setRegisteredEmail(formData.email);
      setAutoCheckEnabled(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsCheckingVerification(true);
    setError('');

    try {
      const response = await checkVerificationStatus(registeredEmail);
      if (response.email_verified) {
        setVerificationMessage('이메일 인증이 완료되었습니다! 로그인 화면으로 이동합니다.');
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setVerificationMessage('아직 이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.');
      }
    } catch (err: any) {
      console.error('Verification check error:', err);
      setError(err.response?.data?.detail || '인증 상태 확인 중 오류가 발생했습니다.');
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    setError('');

    try {
      await resendVerificationEmail({ email: registeredEmail });
      setVerificationMessage('인증 이메일을 다시 보냈습니다.');
    } catch (err: any) {
      console.error('Verification resend error:', err);
      setError(err.response?.data?.detail || '이메일 재발송 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">회원가입</h2>
        <p className="auth-subtitle">NONGBUX에 오신 것을 환영합니다</p>
        
        {showEmailVerification ? (
          <div className="email-verification-section">
            <div className="verification-icon">📧</div>
            <h3>이메일 인증이 필요합니다</h3>
            <p className="verification-email">
              <strong>{registeredEmail}</strong>로 인증 이메일을 발송했습니다.
            </p>
            <p className="verification-instruction">
              이메일을 확인하고 인증 링크를 클릭한 후, 아래 버튼을 눌러 인증을 완료해주세요.
            </p>

            <div className="auto-check-info">
              <p>💡 <strong>자동 확인 기능</strong></p>
              <p>이메일에서 인증을 완료하시면 자동으로 감지하여 로그인 화면으로 이동합니다.</p>
            </div>

            {verificationMessage && (
              <div className={`verification-message ${verificationMessage.includes('완료') ? 'success' : 'info'}`}>
                {verificationMessage}
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className="verification-actions">
              <button
                type="button"
                className="auth-button primary"
                onClick={handleCheckVerification}
                disabled={isCheckingVerification}
              >
                {isCheckingVerification ? (
                  <>
                    <span className="loading-spinner">⏳</span>
                    인증 확인 중...
                  </>
                ) : (
                  <>
                    ✅ 인증 완료 확인
                  </>
                )}
              </button>

              <button
                type="button"
                className="auth-button secondary"
                onClick={handleResendVerification}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner">⏳</span>
                    발송 중...
                  </>
                ) : (
                  <>
                    📤 인증 이메일 재발송
                  </>
                )}
              </button>
            </div>

            <div className="verification-help">
              <p><strong>이메일이 오지 않았나요?</strong></p>
              <ul>
                <li>스팸 폴더를 확인해보세요</li>
                <li>이메일 주소가 정확한지 확인해보세요</li>
                <li>몇 분 후에 다시 시도해보세요</li>
              </ul>
            </div>

            <div className="verification-footer">
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setShowEmailVerification(false);
                  setRegisteredEmail('');
                  setVerificationMessage('');
                  setError('');
                }}
              >
                회원가입으로 돌아가기
              </button>
            </div>
          </div>
        ) : (
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
        )}

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