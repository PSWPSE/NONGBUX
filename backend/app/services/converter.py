import os
from datetime import datetime
from pathlib import Path
import anthropic
from dotenv import load_dotenv
import re

class NewsConverter:
    def __init__(self, api_key=None):
        load_dotenv()
        # 사용자별 API 키가 있으면 사용, 없으면 환경변수에서 가져오기
        self.api_key = api_key or os.getenv('ANTHROPIC_API_KEY')
        
        if not self.api_key:
            raise ValueError("Anthropic API key is required")
            
        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.output_dir = Path('converted_articles')
        self.output_dir.mkdir(exist_ok=True)

    def read_txt_file(self, file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Parse the content
        title_match = re.search(r'제목: (.*?)\n={2,}', content)
        meta_match = re.search(r'메타 정보:\ndescription: (.*?)\n-{2,}', content, re.DOTALL)
        content_match = re.search(r'본문:\n(.*?)$', content, re.DOTALL)
        
        title = title_match.group(1) if title_match else ""
        description = meta_match.group(1).strip() if meta_match else ""
        main_content = content_match.group(1).strip() if content_match else ""
        
        return {
            'title': title,
            'description': description,
            'content': main_content
        }

    def clean_response(self, response):
        """Clean the API response text"""
        # Convert to string and remove TextBlock formatting
        text = str(response)
        text = re.sub(r'\[.*?\]', '', text)
        text = text.replace('TextBlock(citations=None, text=', '')
        text = text.replace(', type=\'text\')', '')
        
        # Remove extra quotes and newlines at the start
        text = text.strip('"\'')
        text = text.lstrip('\n')
        
        # Replace escaped newlines with actual newlines
        text = text.replace('\\n', '\n')
        
        return text.strip()

    def extract_keywords(self, content):
        """Extract keywords from content using Claude"""
        prompt = f"""당신은 뉴스 기사에서 핵심 키워드를 추출하는 전문가입니다.
        다음 기사에서 5-7개의 관련 키워드를 추출하여 해시태그 형식으로 반환해주세요.
        
        규칙:
        1. 해시태그는 한글 스타일로 작성 (#키워드)
        2. 각 해시태그는 공백으로 구분
        3. 주식 종목이 언급된 경우 반드시 포함
        4. 가장 중요한 주제어 위주로 선정
        5. 다른 텍스트나 설명 없이 해시태그만 반환
        
        예시 형식:
        #키워드1 #키워드2 #키워드3 #키워드4 #키워드5
        
        Article: {content}"""
        
        message = self.client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=300,
            temperature=0,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        return self.clean_response(message.content[0])

    def generate_markdown_content(self, content):
        """Generate markdown content using Claude"""
        example = """💰 크라켄, 암호화폐 시장 점유율 확대 위해 혁신적인 P2P 결제앱 출시

▶ 표결 현황:
• "vote-a-rama" 새벽까지 지속, 종료 시점 불투명
• 일출 전 최종 표결 가능성 있다고 언론 보도
• 화요일부터 계속된 수정안 표결 과정

▶ 통과 조건:
• 상원 100명 중 통상 60명 찬성 필요하지만 "reconciliation" 절차로 과반수만 필요
• 공화당 근소한 상원 장악, 민주당 강력 반대

▶ 법안 내용과 비용:
1. 2017년 트럼프 세금감면 연장
2. 신규 세금감면 도입
3. 국방·국경보안 지출 증가

▶ 내부 갈등:
• 일론 머스크 "미친 법안"이라 강력 비판, 신정당 창당 위협
• 테슬라 $TSLA 보조금 철회 위협으로 응수"""

        prompt = f"""당신은 뉴스 기사를 한국어 스타일의 마크다운 문서로 변환하는 전문가입니다.
        아래의 형식과 스타일을 정확히 따라 변환해주세요.

        필수 형식:
        1. 제목 형식: 이모지 제목내용
           예시: "💰 크라켄, 암호화폐 시장 점유율 확대 위해 혁신적인 P2P 결제앱 출시"
           - 제목 시작에 내용을 잘 표현하는 이모지 하나만 사용
           - 제목은 반드시 첫 줄에 위치
           - 제목 다음에는 빈 줄 하나 추가
           - 제목은 내용을 기반으로 독자의 관심을 끌 수 있게 작성
           - 단순 사실 나열보다는 핵심 가치나 의미를 담아 작성

        2. 섹션 구조:
           - 각 주요 섹션은 ▶로 시작
           - 섹션 제목은 명사형으로 끝남 (예: "현황:", "전망:", "영향:")
           - 섹션 제목 뒤에는 반드시 콜론(:) 사용

        3. 글머리 기호:
           - 주요 사실/현황은 • 기호 사용
           - 순차적 내용이나 상세 설명은 1. 2. 3. 번호 사용
           - 인용구나 발언은 따옴표(" ") 사용

        4. 문체와 톤:
           - 객관적이고 명확한 문체 사용
           - 문장은 간결하게, 되도록 1-2줄 이내로 작성
           - 전문 용어는 가능한 한글로 풀어서 설명
           - 숫자나 통계는 단위와 함께 명확히 표기

        5. 구조화:
           - 중요도와 시간 순서를 고려한 섹션 배치
           - 관련 내용은 같은 섹션에 모아서 정리
           - 섹션 간 적절한 줄바꿈으로 가독성 확보
           - 마지막에는 향후 전망이나 결론 포함

        6. 특별 규칙:
           - 주식 종목명이 나오면 반드시 종목명 뒤에 $심볼 표기
           예: 테슬라 $TSLA, 애플 $AAPL
           - 괄호 사용하지 않고 공백으로 구분

        예시 형식:
        {example}

        입력 데이터:
        제목: {content['title']}
        설명: {content['description']}
        본문: {content['content']}

        제목은 반드시 첫 줄에 위치하고, 내용을 잘 표현하는 이모지 하나를 시작에 넣어주세요.
        제목은 단순히 사실을 나열하는 것이 아니라, 내용의 핵심 가치나 의미를 담아 독자의 관심을 끌 수 있게 작성해주세요.
        
        이모지 선택 가이드:
        - 금융/투자 관련: 💰 💵 📈 📊
        - 기술/혁신 관련: 🚀 💡 🔧 🌟
        - 정책/규제 관련: ⚖️ 📜 🏛️ 🔨
        - 갈등/경쟁 관련: 🔥 ⚔️ 🎯 🎲
        - 협력/계약 관련: 🤝 📝 🎊 🌈
        - 성장/발전 관련: 🌱 🎉 💪 ⭐
        """
        
        message = self.client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=2000,
            temperature=0,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        response = self.clean_response(message.content[0])
        
        # Ensure the title is properly formatted
        if not response.startswith(('💰', '💵', '📈', '📊', '🚀', '💡', '🔧', '🌟', '⚖️', '📜', '🏛️', '🔨', '🔥', '⚔️', '🎯', '🎲', '🤝', '📝', '🎊', '🌈', '🌱', '🎉', '💪', '⭐')):
            # Get the first line as title
            lines = response.split('\n')
            title = lines[0].strip('() ')
            
            # Get title from input if first line is not suitable
            if len(title) < 10 or title.isdigit():
                title = content['title']
            
            # Format the title properly with a default emoji
            formatted_title = f"📰 {title}\n"
            
            # Replace the first line with formatted title
            response = formatted_title + '\n'.join(lines[1:])
        
        # Fix stock symbol format
        response = re.sub(r'(\w+)\((\$[A-Z]+)\)', r'\1 \2', response)
        
        return response

    def convert_to_markdown(self, data):
        """Convert parsed data to markdown format"""
        # Generate markdown content
        markdown_content = self.generate_markdown_content(data)
        
        # Extract keywords
        keywords = self.extract_keywords(f"{data['title']}\n{data['description']}\n{data['content']}")
        
        # Combine content and keywords with proper spacing
        final_content = f"{markdown_content}\n\n{keywords}"
        
        return final_content

    def process_file(self, file_path):
        """Process a single TXT file"""
        print(f"Processing {file_path}...")
        data = self.read_txt_file(file_path)
        markdown_content = self.convert_to_markdown(data)
        
        # Create output filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_filename = f"{Path(file_path).stem}_{timestamp}.md"
        output_path = self.output_dir / output_filename
        
        # Save markdown content
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(markdown_content)
        
        print(f"Created {output_path}")

    def process_directory(self, directory_path):
        """Process all TXT files in a directory"""
        directory = Path(directory_path)
        for txt_file in directory.glob('*.txt'):
            self.process_file(txt_file)

def main():
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python converter.py <txt_file_or_directory>")
        sys.exit(1)
    
    path = sys.argv[1]
    converter = NewsConverter()
    
    if os.path.isfile(path):
        converter.process_file(path)
    elif os.path.isdir(path):
        converter.process_directory(path)
    else:
        print(f"Error: {path} is not a valid file or directory")
        sys.exit(1)

if __name__ == '__main__':
    main() 