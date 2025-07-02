from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from ..core.database import get_db
from ..core.auth import get_current_active_user
from ..core.security import decrypt_api_key
from ..models.models import User, Content
from ..schemas.schemas import ExtractRequest, ExtractResponse, Content as ContentSchema
from ..services.extractor import WebExtractor
from ..services.converter import NewsConverter

router = APIRouter()

@router.post("/extract", response_model=ExtractResponse)
async def extract_content(
    request: ExtractRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Extract and convert content from URL."""
    try:
        # 사용자의 API 키 확인
        if not current_user.anthropic_api_key or not current_user.api_key_active:
            raise HTTPException(
                status_code=400, 
                detail="Claude API 키가 설정되지 않았거나 비활성화되어 있습니다. 설정 페이지에서 API 키를 등록해주세요."
            )
        
        # API 키 복호화
        try:
            user_api_key = decrypt_api_key(current_user.anthropic_api_key)
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="API 키 복호화에 실패했습니다. 설정 페이지에서 API 키를 다시 등록해주세요."
            )
        
        # Extract content using WebExtractor
        extractor = WebExtractor(use_selenium=False, save_to_file=False)
        extracted_data = extractor.extract_data(request.url)
        
        if not extracted_data['success']:
            raise HTTPException(status_code=400, detail=extracted_data['error'])
        
        # Convert content using NewsConverter with user's API key
        try:
            converter = NewsConverter(api_key=user_api_key)
            converted_content = converter.convert_to_markdown({
                'title': extracted_data['title'],
                'description': extracted_data.get('metadata', {}).get('description', ''),
                'content': extracted_data['content']['text']
            })
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=f"API 키 오류: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"콘텐츠 변환 중 오류가 발생했습니다: {str(e)}"
            )
        
        # Save to database
        db_content = Content(
            url=request.url,
            original_content=extracted_data,
            converted_content=converted_content,
            user_id=current_user.id
        )
        db.add(db_content)
        db.commit()
        db.refresh(db_content)
        
        return ExtractResponse(
            success=True,
            original_content=extracted_data,
            converted_content=converted_content,
            content_id=db_content.id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[ContentSchema])
async def get_user_contents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all contents for current user."""
    contents = db.query(Content).filter(Content.user_id == current_user.id).all()
    return contents

@router.get("/{content_id}", response_model=ContentSchema)
async def get_content(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get specific content by ID."""
    content = db.query(Content).filter(
        Content.id == content_id,
        Content.user_id == current_user.id
    ).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    return content

@router.delete("/{content_id}")
async def delete_content(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete specific content by ID."""
    content = db.query(Content).filter(
        Content.id == content_id,
        Content.user_id == current_user.id
    ).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    db.delete(content)
    db.commit()
    
    return {"message": "Content deleted successfully"}
