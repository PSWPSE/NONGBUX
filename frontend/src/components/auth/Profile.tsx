import React, { useState, useEffect } from 'react';
import { 
  getUserProfile, 
  updateUserProfile, 
  changePassword, 
  deleteAccount,
  getUserStats,
  UserProfile as UserProfileType,
  UserUpdate,
  PasswordChange
} from '../../services/api';
import './Auth.css';

interface ProfileProps {
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onLogout }) => {
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'stats' | 'danger'>('profile');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    display_name: '',
    profile_image: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [profileData, statsData] = await Promise.all([
        getUserProfile(),
        getUserStats()
      ]);
      
      setProfile(profileData);
      setStats(statsData);
      setProfileForm({
        full_name: profileData.full_name || '',
        display_name: profileData.display_name || '',
        profile_image: profileData.profile_image || ''
      });
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError('프로필 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const updateData: UserUpdate = {};
      if (profileForm.full_name !== profile?.full_name) {
        updateData.full_name = profileForm.full_name;
      }
      if (profileForm.display_name !== profile?.display_name) {
        updateData.display_name = profileForm.display_name;
      }
      if (profileForm.profile_image !== profile?.profile_image) {
        updateData.profile_image = profileForm.profile_image;
      }

      if (Object.keys(updateData).length === 0) {
        setError('변경된 정보가 없습니다.');
        return;
      }

      const updatedProfile = await updateUserProfile(updateData);
      setProfile(updatedProfile);
      setSuccess('프로필이 성공적으로 업데이트되었습니다.');
    } catch (err: any) {
      setError(err.response?.data?.detail || '프로필 업데이트에 실패했습니다.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    try {
      await changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setSuccess('비밀번호가 성공적으로 변경되었습니다.');
    } catch (err: any) {
      setError(err.response?.data?.detail || '비밀번호 변경에 실패했습니다.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    const confirmText = prompt('계정 삭제를 확인하려면 "DELETE"를 입력하세요:');
    if (confirmText !== 'DELETE') {
      return;
    }

    try {
      await deleteAccount();
      alert('계정이 성공적으로 삭제되었습니다.');
      onLogout();
    } catch (err: any) {
      setError(err.response?.data?.detail || '계정 삭제에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <span className="loading-spinner">⏳</span>
            <p>프로필 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="error-message">프로필 정보를 불러올 수 없습니다.</div>
        </div>
      </div>
    );
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email ? email[0].toUpperCase() : '?';
  };

  return (
    <div className="auth-container" style={{ alignItems: 'flex-start', paddingTop: '40px' }}>
      <div className="auth-card" style={{ maxWidth: '600px' }}>
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.profile_image ? (
              <img src={profile.profile_image} alt="Profile" />
            ) : (
              getInitials(profile.full_name || profile.display_name, profile.email)
            )}
          </div>
          <div className="profile-info">
            <h3>{profile.display_name || profile.full_name || profile.email}</h3>
            <p>{profile.email}</p>
            <div className={`verification-badge ${profile.email_verified ? 'verified' : 'unverified'}`}>
              {profile.email_verified ? '✓ 인증됨' : '⚠ 미인증'}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '0' }}>
            {[
              { key: 'profile', label: '프로필' },
              { key: 'password', label: '비밀번호' },
              { key: 'stats', label: '통계' },
              { key: 'danger', label: '위험' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: 'none',
                  borderBottom: activeTab === tab.key ? '2px solid #667eea' : '2px solid transparent',
                  color: activeTab === tab.key ? '#667eea' : '#6b7280',
                  fontWeight: activeTab === tab.key ? '600' : '400',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileUpdate} className="auth-form">
            <div className="form-group">
              <label className="form-label">전체 이름</label>
              <input
                type="text"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                className="form-input"
                placeholder="홍길동"
              />
            </div>

            <div className="form-group">
              <label className="form-label">표시 이름</label>
              <input
                type="text"
                value={profileForm.display_name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, display_name: e.target.value }))}
                className="form-input"
                placeholder="길동이"
              />
            </div>

            <div className="form-group">
              <label className="form-label">프로필 이미지 URL</label>
              <input
                type="url"
                value={profileForm.profile_image}
                onChange={(e) => setProfileForm(prev => ({ ...prev, profile_image: e.target.value }))}
                className="form-input"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <button type="submit" className="auth-button">
              프로필 업데이트
            </button>
          </form>
        )}

        {activeTab === 'password' && (
          <form onSubmit={handlePasswordChange} className="auth-form">
            <div className="form-group">
              <label className="form-label">현재 비밀번호</label>
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">새 비밀번호</label>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                className="form-input"
                placeholder="최소 8자, 영문자와 숫자 포함"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">새 비밀번호 확인</label>
              <input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                className="form-input"
                required
              />
            </div>

            <button type="submit" className="auth-button">
              비밀번호 변경
            </button>
          </form>
        )}

        {activeTab === 'stats' && stats && (
          <div className="profile-section">
            <h4 style={{ marginBottom: '16px', color: '#2d3748' }}>사용 통계</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">{stats.total_extractions || 0}</div>
                <div className="stat-label">총 추출 횟수</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{stats.recent_extractions_30d || 0}</div>
                <div className="stat-label">최근 30일</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{stats.recent_extractions_7d || 0}</div>
                <div className="stat-label">최근 7일</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{stats.recent_extractions_today || 0}</div>
                <div className="stat-label">오늘</div>
              </div>
            </div>
            
            <div style={{ marginTop: '24px', padding: '16px', background: '#f7fafc', borderRadius: '8px' }}>
              <p><strong>가입일:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
              <p><strong>마지막 로그인:</strong> {profile.last_login ? new Date(profile.last_login).toLocaleString() : '정보 없음'}</p>
              <p><strong>로그인 횟수:</strong> {profile.login_count}회</p>
              <p><strong>API 키 상태:</strong> {stats.api_key_active ? '활성화됨' : '설정되지 않음'}</p>
            </div>
          </div>
        )}

        {activeTab === 'danger' && (
          <div className="profile-section">
            <h4 style={{ marginBottom: '16px', color: '#dc2626' }}>위험한 작업</h4>
            <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '16px' }}>
              <p style={{ color: '#dc2626', margin: '0', fontSize: '14px' }}>
                ⚠️ 계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              style={{
                background: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              계정 삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 