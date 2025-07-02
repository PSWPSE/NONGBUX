from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import anthropic

from ..core.database import get_db
from ..core.auth import get_current_active_user
from ..core.security import encrypt_api_key, decrypt_api_key, mask_api_key, verify_password, get_password_hash
from ..models.models import User
from ..schemas.schemas import ApiKeySet, ApiKeyStatus, ApiKeyTestResponse

router = APIRouter()

@router.get("/api-key-status", response_model=ApiKeyStatus)
async def get_api_key_status(
    current_user: User = Depends(get_current_active_user)
):
    """현재 사용자의 API 키 상태를 조회합니다."""
    has_api_key = bool(current_user.anthropic_api_key)
    masked_key = None
    
    if has_api_key:
        try:
            decrypted_key = decrypt_api_key(current_user.anthropic_api_key)
            masked_key = mask_api_key(decrypted_key)
        except Exception:
            has_api_key = False
    
    return ApiKeyStatus(
        has_api_key=has_api_key,
        api_key_active=current_user.api_key_active,
        api_key_verified_at=current_user.api_key_verified_at,
        masked_key=masked_key
    )

@router.post("/api-key/test", response_model=ApiKeyTestResponse)
async def test_api_key(
    request: ApiKeySet,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """API 키를 테스트합니다."""
    try:
        # Claude API 테스트 요청
        client = anthropic.Anthropic(api_key=request.api_key)
        
        # 간단한 테스트 메시지
        message = client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=50,
            temperature=0,
            messages=[
                {
                    "role": "user",
                    "content": "Hello, please respond with 'API key is working' in Korean."
                }
            ]
        )
        
        # 응답 확인
        response_text = str(message.content[0]).strip()
        if "API key is working" in response_text or "API 키" in response_text or "작동" in response_text:
            return ApiKeyTestResponse(
                success=True,
                message="API 키가 정상적으로 작동합니다."
            )
        else:
            return ApiKeyTestResponse(
                success=True,
                message="API 키가 작동하지만 예상과 다른 응답을 받았습니다."
            )
            
    except anthropic.AuthenticationError:
        return ApiKeyTestResponse(
            success=False,
            message="인증 실패: API 키가 유효하지 않습니다.",
            error="Invalid API key"
        )
    except anthropic.PermissionDeniedError:
        return ApiKeyTestResponse(
            success=False,
            message="권한 거부: API 키에 필요한 권한이 없습니다.",
            error="Permission denied"
        )
    except anthropic.RateLimitError:
        return ApiKeyTestResponse(
            success=False,
            message="요청 한도 초과: 잠시 후 다시 시도해주세요.",
            error="Rate limit exceeded"
        )
    except Exception as e:
        return ApiKeyTestResponse(
            success=False,
            message="API 키 테스트 중 오류가 발생했습니다.",
            error=str(e)
        )

@router.post("/api-key/set", response_model=ApiKeyStatus)
async def set_api_key(
    request: ApiKeySet,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """API 키를 설정하고 저장합니다."""
    try:
        # 먼저 API 키 테스트
        test_result = await test_api_key(request, current_user, db)
        
        if not test_result.success:
            raise HTTPException(
                status_code=400,
                detail=f"API 키 검증 실패: {test_result.message}"
            )
        
        # API 키 암호화 및 저장
        encrypted_key = encrypt_api_key(request.api_key)
        
        current_user.anthropic_api_key = encrypted_key
        current_user.api_key_active = True
        current_user.api_key_verified_at = datetime.utcnow()
        
        db.commit()
        db.refresh(current_user)
        
        return ApiKeyStatus(
            has_api_key=True,
            api_key_active=True,
            api_key_verified_at=current_user.api_key_verified_at,
            masked_key=mask_api_key(request.api_key)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"API 키 저장 중 오류가 발생했습니다: {str(e)}"
        )

@router.delete("/api-key")
async def delete_api_key(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """API 키를 삭제합니다."""
    current_user.anthropic_api_key = None
    current_user.api_key_active = False
    current_user.api_key_verified_at = None
    
    db.commit()
    
    return {"message": "API 키가 성공적으로 삭제되었습니다."} 