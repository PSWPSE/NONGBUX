import requests
from bs4 import BeautifulSoup, Tag
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager
from fake_useragent import UserAgent
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
import logging
import time
import os

class WebExtractor:
    def __init__(self, use_selenium: bool = False, save_to_file: bool = True):
        """
        웹 콘텐츠 추출기 초기화
        
        Args:
            use_selenium: Selenium 사용 여부
            save_to_file: 결과를 파일로 저장할지 여부
        """
        self.use_selenium = use_selenium
        self.save_to_file = save_to_file
        self.driver = None
        self.session = requests.Session()
        self.ua = UserAgent()
        self.setup_logging()
        
        if use_selenium:
            self.setup_selenium()
    
    def setup_logging(self) -> None:
        """로깅 설정"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
    
    def setup_selenium(self) -> None:
        """Selenium 웹드라이버 설정"""
        options = Options()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument(f'user-agent={self.ua.random}')
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=options)
    
    def extract_data(self, url: str) -> Dict[str, Any]:
        """
        URL에서 데이터 추출
        
        Args:
            url: 추출할 웹 페이지 URL
            
        Returns:
            추출된 데이터 딕셔너리
        """
        try:
            self.logger.info(f"페이지 로딩 중: {url}")
            
            if self.use_selenium:
                data = self._extract_with_selenium(url)
            else:
                data = self._extract_with_requests(url)
            
            if self.save_to_file and data['success']:
                self._save_to_file(data)
            
            return data
            
        except TimeoutException:
            self.logger.error("페이지 로딩 시간 초과")
            return self._error_response(url, "페이지 로딩 시간 초과")
        except WebDriverException as e:
            self.logger.error(f"웹드라이버 오류: {str(e)}")
            return self._error_response(url, f"웹드라이버 오류: {str(e)}")
        except Exception as e:
            self.logger.error(f"데이터 추출 중 오류 발생: {str(e)}")
            return self._error_response(url, str(e))
    
    def _extract_with_requests(self, url: str) -> Dict[str, Any]:
        """requests를 사용한 데이터 추출"""
        headers = {'User-Agent': self.ua.random}
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        return self._parse_content(soup, url)
    
    def _extract_with_selenium(self, url: str) -> Dict[str, Any]:
        """Selenium을 사용한 데이터 추출"""
        self.driver.get(url)
        WebDriverWait(self.driver, 20).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        soup = BeautifulSoup(self.driver.page_source, 'html.parser')
        return self._parse_content(soup, url)
    
    def _parse_content(self, soup: BeautifulSoup, url: str) -> Dict[str, Any]:
        """HTML 콘텐츠 파싱"""
        article = self._find_article(soup)
        if not article:
            return self._error_response(url, "기사 본문을 찾을 수 없습니다")
        
        return {
            'success': True,
            'url': url,
            'timestamp': datetime.now().isoformat(),
            'title': self._get_title(soup),
            'metadata': self._get_metadata(soup),
            'content': self._get_content(article),
            'author': self._get_author(soup),
            'publish_date': self._get_publish_date(soup)
        }
    
    def _find_article(self, soup: BeautifulSoup) -> Optional[Tag]:
        """기사 본문 요소 찾기"""
        return (soup.find('article') or 
                soup.find(class_='article') or 
                soup.find(class_='articlePage') or
                soup.find(class_=lambda x: x and 'article' in str(x).lower()))
    
    def _get_title(self, soup: BeautifulSoup) -> str:
        """제목 추출"""
        title = soup.find('h1')
        if title:
            return title.get_text().strip()
        
        title = soup.find('title')
        return title.get_text().strip() if title else 'No Title'
    
    def _get_metadata(self, soup: BeautifulSoup) -> Dict[str, str]:
        """메타데이터 추출"""
        metadata: Dict[str, str] = {}
        meta_names = ['description', 'author', 'published_time', 'keywords']
        
        for meta in soup.find_all('meta'):
            name = meta.get('name', meta.get('property', '')).lower()
            content = meta.get('content', '')
            if name in meta_names and content:
                metadata[name] = content
        
        return metadata
    
    def _get_content(self, article: Tag) -> Dict[str, Any]:
        """본문 내용 추출"""
        paragraphs = []
        for p in article.find_all(['p', 'h2', 'h3', 'blockquote']):
            text = p.get_text().strip()
            if text and not any(text.startswith(x) for x in ['Recommended', 'Related']):
                paragraphs.append(text)
        
        return {
            'text': '\n\n'.join(paragraphs),
            'paragraphs': paragraphs
        }
    
    def _get_author(self, soup: BeautifulSoup) -> str:
        """저자 정보 추출"""
        author = soup.find('meta', {'name': 'author'})
        if author:
            return author.get('content', '')
        
        author = soup.find(class_=lambda x: x and 'author' in str(x).lower())
        return author.get_text().strip() if author else ''
    
    def _get_publish_date(self, soup: BeautifulSoup) -> str:
        """발행일 추출"""
        date = (soup.find('meta', {'name': 'date'}) or 
                soup.find('meta', {'property': 'article:published_time'}))
        if date:
            return date.get('content', '')
        
        date = soup.find(class_=lambda x: x and ('date' in str(x).lower() or 'time' in str(x).lower()))
        return date.get_text().strip() if date else ''
    
    def _error_response(self, url: str, error: str) -> Dict[str, Any]:
        """에러 응답 생성"""
        return {
            'success': False,
            'url': url,
            'timestamp': datetime.now().isoformat(),
            'error': error
        }
    
    def _save_to_file(self, data: Dict[str, Any]) -> None:
        """결과를 파일로 저장"""
        os.makedirs('extracted_articles', exist_ok=True)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        txt_path = f'extracted_articles/article_{timestamp}.txt'
        
        with open(txt_path, 'w', encoding='utf-8') as f:
            f.write(f"제목: {data['title']}\n")
            f.write("="*80 + "\n\n")
            
            if data['metadata']:
                f.write("메타 정보:\n")
                for key, value in data['metadata'].items():
                    f.write(f"{key}: {value}\n")
                f.write("-"*80 + "\n\n")
            
            f.write("본문:\n")
            f.write(data['content']['text'])
        
        self.logger.info(f"텍스트 파일 저장됨: {txt_path}")
    
    def close(self) -> None:
        """리소스 정리"""
        if self.driver:
            self.driver.quit()
        self.session.close() 