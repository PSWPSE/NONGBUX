import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../../services/api';
import './Auth.css';

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('인증 토큰이 없습니다.');
        return;
      }

      try {
        const response = await verifyEmail({ token });
        setStatus('success');
        setMessage(response.message || '이메일 인증이 완료되었습니다!');
        
        // 3초 후 로그인 페이지로 리디렉션
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.detail || '인증 처리 중 오류가 발생했습니다.');
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="email-verification-section">
          {status === 'loading' && (
            <>
              <div className="verification-icon">⏳</div>
              <h2 className="auth-title">이메일 인증 중...</h2>
              <p className="auth-subtitle">잠시만 기다려주세요.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="verification-icon">✅</div>
              <h2 className="auth-title">인증 완료!</h2>
              <div className="verification-message success">
                {message}
              </div>
              <p className="auth-subtitle">
                이제 NONGBUX 서비스를 이용할 수 있습니다.<br />
                3초 후 로그인 페이지로 이동합니다.
              </p>
              <button
                type="button"
                className="auth-button primary"
                onClick={handleGoToLogin}
              >
                지금 로그인하기
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="verification-icon">❌</div>
              <h2 className="auth-title">인증 실패</h2>
              <div className="verification-message error">
                {message}
              </div>
              <p className="auth-subtitle">
                인증 링크가 만료되었거나 유효하지 않습니다.<br />
                회원가입을 다시 진행하거나 고객지원에 문의해주세요.
              </p>
              <div className="verification-actions">
                <button
                  type="button"
                  className="auth-button primary"
                  onClick={handleGoToLogin}
                >
                  로그인 페이지로 이동
                </button>
                <button
                  type="button"
                  className="auth-button secondary"
                  onClick={() => navigate('/register')}
                >
                  회원가입 다시하기
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification; 