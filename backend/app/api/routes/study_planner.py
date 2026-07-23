from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.services.ai_provider import get_chat_completion

router = APIRouter(prefix="/study-planner", tags=["study-planner"])

SYSTEM_PROMPT = (
    "You build realistic, day-by-day study schedules for university students. "
    "Given a free-text description of upcoming exams, assignments, deadlines, "
    "and the free time the student has available, produce a plan organized "
    "by day, prioritizing nearer deadlines and harder/higher-weight items. "
    "Include short breaks and be realistic about how much can be done in a "
    "day — don't overload any single day. Keep it concise and scannable."
)


class StudyPlanRequest(BaseModel):
    goals: str  # free text: upcoming exams/assignments/deadlines + available free time


class StudyPlanResponse(BaseModel):
    plan_text: str


@router.post("/generate", response_model=StudyPlanResponse)
async def generate_study_plan(payload: StudyPlanRequest, _=Depends(get_current_user)) -> StudyPlanResponse:
    plan_text = await get_chat_completion(SYSTEM_PROMPT, payload.goals)
    return StudyPlanResponse(plan_text=plan_text)
