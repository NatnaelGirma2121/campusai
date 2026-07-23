from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.services.ai_provider import transcribe_audio

router = APIRouter(prefix="/voice", tags=["voice"])

MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB, matches typical Whisper API limits


class TranscriptionResponse(BaseModel):
    text: str


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(
    file: UploadFile = File(...),
    _=Depends(get_current_user),
) -> TranscriptionResponse:
    file_bytes = await file.read()
    if len(file_bytes) > MAX_AUDIO_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Audio file too large (max 25 MB).")
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    text = await transcribe_audio(file_bytes, file.filename)
    return TranscriptionResponse(text=text)
