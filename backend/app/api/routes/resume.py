from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.services.ai_provider import get_chat_completion

router = APIRouter(prefix="/resume", tags=["resume"])

SYSTEM_PROMPT = (
    "You write clear, well-structured resume drafts for university students "
    "and recent graduates. Given a free-text description of someone's "
    "education, experience, skills, and projects, produce a resume in plain "
    "text with clear section headings (e.g. EDUCATION, EXPERIENCE, SKILLS, "
    "PROJECTS). Use concise, achievement-oriented bullet points. Do not "
    "invent facts, dates, or accomplishments the person didn't mention — "
    "only organize and phrase what they gave you."
)


class ResumeRequest(BaseModel):
    background: str


class ResumeResponse(BaseModel):
    resume_text: str


@router.post("/generate", response_model=ResumeResponse)
async def generate_resume(payload: ResumeRequest, _=Depends(get_current_user)) -> ResumeResponse:
    resume_text = await get_chat_completion(SYSTEM_PROMPT, payload.background)
    return ResumeResponse(resume_text=resume_text)
