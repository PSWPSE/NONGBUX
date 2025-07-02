import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Settings.css';

interface ApiKeyStatus {
  has_api_key: boolean;
  api_key_active: boolean;
  api_key_verified_at: string | null;
  masked_key?: string;
}

interface ApiKeyTestResponse {
  success: boolean;
  message: string;
  error?: string;
}

interface TestResult {
  isVisible: boolean;
  success: boolean;
  message: string;
  timestamp: Date;
}

const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    fetchApiKeyStatus();
  }, []);

  const fetchApiKeyStatus = async () => {
    try {
      const response = await api.get('/api/settings/api-key-status');
      setApiKeyStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch API key status:', error);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const showTestResult = (success: boolean, message: string) => {
    setTestResult({
      isVisible: true,
      success,
      message,
      timestamp: new Date()
    });
    
    // 10초 후 테스트 결과 숨기기
    setTimeout(() => {
      setTestResult(null);
    }, 10000);
  };

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      showMessage('API 키를 입력해주세요.', 'error');
      return;
    }

    setTesting(true);
    setTestResult(null); // 이전 테스트 결과 클리어
    
    try {
      const response = await api.post('/api/settings/api-key/test', {
        api_key: apiKey
      });
      
      const result: ApiKeyTestResponse = response.data;
      
      if (result.success) {
        showTestResult(true, `✅ ${result.message}`);
        showMessage('API 키 테스트가 성공했습니다!', 'success');
      } else {
        showTestResult(false, `❌ ${result.message}`);
        showMessage('API 키 테스트가 실패했습니다.', 'error');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'API 키 테스트 중 오류가 발생했습니다.';
      showTestResult(false, `❌ ${errorMessage}`);
      showMessage(errorMessage, 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      showMessage('API 키를 입력해주세요.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/settings/api-key/set', {
        api_key: apiKey
      });
      
      setApiKeyStatus(response.data);
      setApiKey(''); // 보안상 입력 필드 클리어
      showMessage('API 키가 성공적으로 저장되었습니다.', 'success');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'API 키 저장 중 오류가 발생했습니다.';
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!window.confirm('정말로 API 키를 삭제하시겠습니까?')) {
      return;
    }

    setLoading(true);
    try {
      await api.delete('/api/settings/api-key');
      await fetchApiKeyStatus();
      showMessage('API 키가 성공적으로 삭제되었습니다.', 'success');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'API 키 삭제 중 오류가 발생했습니다.';
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '없음';
    return new Date(dateString).toLocaleString('ko-KR');
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>설정</h2>
        <p>NONGBUX 서비스 이용을 위한 설정을 관리합니다.</p>
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      <div className="settings-section">
        <h3>Claude API 키 설정</h3>
        <p className="section-description">
          콘텐츠 변환 서비스를 이용하기 위해 Anthropic Claude API 키가 필요합니다.
        </p>

        {apiKeyStatus && (
          <div className="api-key-status">
            <div className="status-item">
              <span className="status-label">API 키 상태:</span>
              <span className={`status-value ${apiKeyStatus.api_key_active ? 'active' : 'inactive'}`}>
                {apiKeyStatus.has_api_key 
                  ? (apiKeyStatus.api_key_active ? '활성화됨' : '비활성화됨')
                  : '설정되지 않음'
                }
              </span>
            </div>
            
            {apiKeyStatus.masked_key && (
              <div className="status-item">
                <span className="status-label">등록된 키:</span>
                <span className="status-value masked-key">{apiKeyStatus.masked_key}</span>
              </div>
            )}
            
            <div className="status-item">
              <span className="status-label">마지막 검증:</span>
              <span className="status-value">{formatDate(apiKeyStatus.api_key_verified_at)}</span>
            </div>
          </div>
        )}

        <div className="api-key-form">
          <div className="form-group">
            <label htmlFor="apiKey">Claude API 키</label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="api-key-input"
            />
            <small className="form-help">
              Anthropic Console에서 발급받은 API 키를 입력하세요.
            </small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleTestApiKey}
              disabled={testing || !apiKey.trim()}
              className="btn btn-secondary"
            >
              {testing ? (
                <>
                  <span className="spinner"></span>
                  테스트 중...
                </>
              ) : (
                '🔍 API 키 테스트'
              )}
            </button>
            
            <button
              type="button"
              onClick={handleSaveApiKey}
              disabled={loading || !apiKey.trim()}
              className="btn btn-primary"
            >
              {loading ? '저장 중...' : '💾 API 키 저장'}
            </button>
          </div>

          {/* 테스트 결과 표시 섹션 */}
          {testResult && (
            <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
              <div className="test-result-header">
                <h4>
                  {testResult.success ? '🎉 테스트 성공' : '❌ 테스트 실패'}
                </h4>
                <span className="test-time">
                  {testResult.timestamp.toLocaleTimeString('ko-KR')}
                </span>
              </div>
              <p className="test-message">{testResult.message}</p>
              {testResult.success && (
                <div className="success-actions">
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    disabled={loading || !apiKey.trim()}
                    className="btn btn-primary btn-small"
                  >
                    {loading ? '저장 중...' : '✅ 이 키로 저장하기'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {apiKeyStatus?.has_api_key && (
          <div className="danger-zone">
            <h4>위험 구역</h4>
            <p>API 키를 삭제하면 콘텐츠 변환 서비스를 이용할 수 없습니다.</p>
            <button
              type="button"
              onClick={handleDeleteApiKey}
              disabled={loading}
              className="btn btn-danger"
            >
              API 키 삭제
            </button>
          </div>
        )}
      </div>

      <div className="settings-section">
        <h3>도움말</h3>
        <div className="help-content">
          <h4>Claude API 키 발급 방법</h4>
          <ol>
            <li><a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer">Anthropic Console</a>에 로그인합니다.</li>
            <li>API Keys 메뉴에서 새 API 키를 생성합니다.</li>
            <li>생성된 API 키를 복사하여 위 입력란에 붙여넣습니다.</li>
            <li>'API 키 테스트' 버튼을 클릭하여 키가 정상 작동하는지 확인합니다.</li>
            <li>'API 키 저장' 버튼을 클릭하여 키를 저장합니다.</li>
          </ol>
          
          <h4>보안</h4>
          <p>입력된 API 키는 암호화되어 안전하게 저장됩니다. 다른 사용자는 귀하의 API 키에 접근할 수 없습니다.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings; 