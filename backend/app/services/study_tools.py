import json
import re

from fastapi import HTTPException

STUDY_MODES = ("summary", "flashcards", "quiz", "key_concepts")

_SYSTEM_PROMPTS = {
    "summary": (
        "You produce concise study summaries for university students. Read the "
        "provided document text and write a clear summary covering the main "
        "ideas, in plain language. "
        'Respond with ONLY a JSON object of the exact shape {"summary": "..."}. '
        "No markdown, no code fences, no extra commentary."
    ),
    "flashcards": (
        "You produce study flashcards for university students. Read the "
        "provided document text and generate 5-10 flashcards covering its key "
        "facts and concepts. "
        'Respond with ONLY a JSON object of the exact shape '
        '{"flashcards": [{"front": "...", "back": "..."}, ...]}. '
        "No markdown, no code fences, no extra commentary."
    ),
    "quiz": (
        "You produce multiple-choice practice quizzes for university students. "
        "Read the provided document text and generate 5 questions, each with "
        "exactly 4 answer choices and one correct answer. "
        'Respond with ONLY a JSON object of the exact shape '
        '{"questions": [{"question": "...", "choices": ["...", "...", "...", "..."], '
        '"correct_index": 0}, ...]}. correct_index is 0-based into choices. '
        "No markdown, no code fences, no extra commentary."
    ),
    "key_concepts": (
        "You extract key concepts for university students studying a document. "
        "Read the provided document text and list the 5-12 most important "
        "concepts or terms, each with a one-sentence explanation. "
        'Respond with ONLY a JSON object of the exact shape '
        '{"concepts": [{"term": "...", "explanation": "..."}, ...]}. '
        "No markdown, no code fences, no extra commentary."
    ),
}


def build_prompt(mode: str, document_title: str, content: str) -> tuple[str, str]:
    if mode not in STUDY_MODES:
        raise HTTPException(status_code=400, detail=f"Unknown study mode '{mode}'")
    system_prompt = _SYSTEM_PROMPTS[mode]
    user_message = f"Document title: {document_title}\n\nContent:\n{content}"
    return system_prompt, user_message


def parse_response(mode: str, raw_text: str) -> dict:
    """LLMs sometimes wrap JSON in markdown fences or add stray text despite
    instructions not to — strip fences and grab the outermost {...} block
    before parsing, and fail with a clear 502 rather than a raw JSONDecodeError
    if the model didn't cooperate."""
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw_text.strip(), flags=re.MULTILINE)
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not match:
        raise HTTPException(
            status_code=502, detail="AI provider returned a response that wasn't valid JSON."
        )
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502, detail="AI provider returned a response that wasn't valid JSON."
        )
