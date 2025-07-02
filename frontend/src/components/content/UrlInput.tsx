import React, { useState } from 'react';
import api from '../../services/api';

interface UrlInputProps {
  onExtractSuccess?: (data: any) => void;
}

interface ExtractedContent {
  success: boolean;
  original_content: any;
  converted_content: string;
  content_id: number;
}

const UrlInput: React.FC<UrlInputProps> = ({ onExtractSuccess }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedContent | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('URL을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setExtractedData(null);

    try {
      const response = await api.post('/api/content/extract', { url });
      setExtractedData(response.data);
      setUrl('');
      
      if (onExtractSuccess) {
        onExtractSuccess(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || '콘텐츠 추출 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const downloadMarkdownFile = (content: string, filename?: string) => {
    // 파일명 생성 (현재 시간 기반)
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-T]/g, '');
    const defaultFilename = `nongbux_content_${timestamp}.md`;
    const finalFilename = filename || defaultFilename;

    // Blob 생성 및 다운로드
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // URL 객체 정리
    URL.revokeObjectURL(url);
  };

  const openInNewTab = (content: string) => {
    // 새 탭에서 마크다운 내용을 미리보기로 표시
    const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NONGBUX - 변환된 콘텐츠</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
            background-color: #f9f9f9;
        }
        .container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        pre {
            background: #f5f5f5;
            padding: 1rem;
            border-radius: 4px;
            white-space: pre-wrap;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
            line-height: 1.5;
        }
        .header {
            text-align: center;
            margin-bottom: 2rem;
            color: #333;
        }
        .actions {
            text-align: center;
            margin-top: 2rem;
        }
        .btn {
            background: #3182ce;
            color: white;
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin: 0 0.5rem;
            text-decoration: none;
            display: inline-block;
        }
        .btn:hover {
            background: #2c5aa0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 NONGBUX 콘텐츠 변환 완료</h1>
            <p>마크다운 형식으로 변환된 콘텐츠입니다.</p>
        </div>
        <pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        <div class="actions">
            <button class="btn" onclick="copyToClipboard()">📋 클립보드에 복사</button>
            <button class="btn" onclick="downloadFile()">💾 파일 다운로드</button>
        </div>
    </div>
    
    <script>
        const content = \`${content.replace(/`/g, '\\`')}\`;
        
        function copyToClipboard() {
            navigator.clipboard.writeText(content).then(() => {
                alert('클립보드에 복사되었습니다!');
            });
        }
        
        function downloadFile() {
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'nongbux_content_${new Date().toISOString().slice(0, 19).replace(/[:\-T]/g, '')}.md';
            a.click();
            URL.revokeObjectURL(url);
        }
    </script>
</body>
</html>`;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      alert('클립보드에 복사되었습니다!');
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      // 폴백: 텍스트 선택 방식
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('클립보드에 복사되었습니다!');
    }
  };

  return (
    <div className="url-input-container">
      <h2>URL에서 콘텐츠 추출하기</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="url"
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            className="url-input"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="extract-btn"
        >
          {loading ? '추출 중...' : '콘텐츠 추출'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}
      
      {extractedData && (
        <div className="extracted-content">
          <div className="success-message">
            ✅ 콘텐츠가 성공적으로 추출되고 변환되었습니다!
          </div>
          
          <div className="content-actions">
            <h3>🚀 생성된 파일 작업:</h3>
            <div className="action-buttons">
              <button 
                className="action-btn primary"
                onClick={() => openInNewTab(extractedData.converted_content)}
              >
                📖 새 탭에서 열기
              </button>
              <button 
                className="action-btn secondary"
                onClick={() => downloadMarkdownFile(extractedData.converted_content)}
              >
                💾 마크다운 다운로드
              </button>
              <button 
                className="action-btn tertiary"
                onClick={() => copyToClipboard(extractedData.converted_content)}
              >
                📋 클립보드 복사
              </button>
            </div>
          </div>
          
          <div className="content-display">
            <h3>📄 변환된 콘텐츠 미리보기:</h3>
            <div className="markdown-content">
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {extractedData.converted_content}
              </pre>
            </div>
            
            <div className="content-info">
              <p><strong>원본 URL:</strong> {extractedData.original_content?.url}</p>
              <p><strong>추출 시간:</strong> {new Date(extractedData.original_content?.timestamp).toLocaleString('ko-KR')}</p>
              {extractedData.original_content?.publish_date && (
                <p><strong>발행 시간:</strong> {extractedData.original_content.publish_date}</p>
              )}
              {extractedData.original_content?.author && (
                <p><strong>작성자:</strong> {extractedData.original_content.author}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UrlInput; 