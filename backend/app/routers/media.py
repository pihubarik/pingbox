from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.core.security import get_current_user
from app.models.user import User
from app.services.media import upload_file

router = APIRouter()

ALLOWED_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "video/mp4", "video/quicktime",
    "application/pdf"
}

MAX_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file.content_type} not allowed"
        )

    file_bytes = await file.read()

    if len(file_bytes) > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large. Max size is 10MB"
        )

    url = await upload_file(file_bytes, file.filename, file.content_type)

    return {
        "url": url,
        "filename": file.filename,
        "size": len(file_bytes),
        "content_type": file.content_type
    }
