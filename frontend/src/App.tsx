import React, { useState, useEffect } from 'react';
import './App.css';
import UrlInput from './components/content/UrlInput';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/auth/Profile';
import Settings from './components/settings/Settings';

interface User {
  id: number;
  email: string;
  full_name?: string;
  display_name?: string;
  email_verified: boolean;
}

type CurrentView = 'main' | 'settings' | 'profile';
type AuthView = 'login' | 'register';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<CurrentView>('main');
  const [authView, setAuthView] = useState<AuthView>('login');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setShowSuccess(true);
    setSuccessMessage(`환영합니다, ${userData.display_name || userData.email}님!`);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleRegisterSuccess = () => {
    setAuthView('login');
    setShowSuccess(true);
    setSuccessMessage('회원가입이 완료되었습니다. 로그인해주세요.');
    setTimeout(() => setShowSuccess(false), 5000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentView('main');
    setAuthView('login');
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return user.display_name || user.full_name || user.email.split('@')[0];
  };

  // 로그인하지 않은 상태
  if (!user) {
    return (
      <div className="App">
        {showSuccess && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#10b981',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            zIndex: 1000,
            animation: 'slideDown 0.3s ease-out'
          }}>
            {successMessage}
          </div>
        )}

        {authView === 'login' ? (
          <Login 
            onLogin={handleLogin}
            onSwitchToRegister={() => setAuthView('register')}
          />
        ) : (
          <Register
            onSuccess={handleRegisterSuccess}
            onSwitchToLogin={() => setAuthView('login')}
          />
        )}
      </div>
    );
  }

  return (
    <div className="App">
      {showSuccess && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#10b981',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          zIndex: 1000,
          animation: 'slideDown 0.3s ease-out'
        }}>
          {successMessage}
        </div>
      )}

      <header className="App-header">
        <div className="header-content">
          <div className="header-left">
            <h1 
              className="service-title"
              onClick={() => setCurrentView('main')}
              style={{ cursor: 'pointer' }}
            >
              NONGBUX
            </h1>
            <p className="service-tagline">뉴스를 마크다운으로, 간편하게</p>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-greeting">
                안녕하세요, {getUserDisplayName()}님!
              </span>
              {!user.email_verified && (
                <span className="verification-warning" title="이메일 인증이 필요합니다">
                  ⚠️
                </span>
              )}
            </div>
            <div className="nav-buttons">
              <button 
                className={`nav-btn ${currentView === 'main' ? 'active' : ''}`}
                onClick={() => setCurrentView('main')}
              >
                홈
              </button>
              <button 
                className={`nav-btn ${currentView === 'profile' ? 'active' : ''}`}
                onClick={() => setCurrentView('profile')}
              >
                프로필
              </button>
              <button 
                className={`nav-btn ${currentView === 'settings' ? 'active' : ''}`}
                onClick={() => setCurrentView('settings')}
              >
                설정
              </button>
              <button className="logout-btn" onClick={handleLogout}>
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="App-main">
        {currentView === 'main' && (
          <>
            <div className="welcome-section">
              <h2>URL을 입력하여 콘텐츠를 추출해보세요</h2>
              <p>웹사이트의 URL을 입력하면 자동으로 콘텐츠를 추출하고 마크다운으로 변환해드립니다.</p>
              
              {!user.email_verified && (
                <div className="warning-banner">
                  <p>⚠️ 이메일 인증이 완료되지 않았습니다. 프로필에서 인증을 완료해주세요.</p>
                </div>
              )}
            </div>
            <UrlInput />
          </>
        )}
        
        {currentView === 'profile' && (
          <Profile onLogout={handleLogout} />
        )}
        
        {currentView === 'settings' && <Settings />}
      </main>

      <footer className="App-footer">
        <p>&copy; 2024 NONGBUX. All rights reserved.</p>
        <p>문의: <a href="mailto:contact@nongbux.com">contact@nongbux.com</a></p>
      </footer>
    </div>
  );
}

export default App;
