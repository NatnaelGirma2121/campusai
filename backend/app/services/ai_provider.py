import json
import math

import httpx
from fastapi import HTTPException, status

from app.core.config import settings


def _require_configured() -> None:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "AI provider is not configured. Set OPENAI_API_KEY (and optionally "
                "OPENAI_BASE_URL to point at a local/compatible model) in .env."
            ),
        )


async def get_embedding(text: str) -> list[float]:
    _require_configured()
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{settings.OPENAI_BASE_URL}/embeddings",
            headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
            json={"model": settings.OPENAI_EMBEDDING_MODEL, "input": text},
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Embedding provider error: {response.text}")
    return response.json()["data"][0]["embedding"]


async def get_chat_completion(system_prompt: str, user_message: str) -> str:
    _require_configured()
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{settings.OPENAI_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
            json={
                "model": settings.OPENAI_CHAT_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                "temperature": 0.2,
            },
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Chat provider error: {response.text}")
    return response.json()["choices"][0]["message"]["content"]


async def get_chat_completion_with_history(
    system_prompt: str, history: list[dict], user_message: str
) -> str:
    """Like get_chat_completion, but includes prior turns — used by the
    tutor, where a student's follow-up question depends on earlier context
    in the same tutoring session."""
    _require_configured()
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{settings.OPENAI_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
            json={"model": settings.OPENAI_CHAT_MODEL, "messages": messages, "temperature": 0.3},
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Chat provider error: {response.text}")
    return response.json()["choices"][0]["message"]["content"]


async def transcribe_audio(file_bytes: bytes, filename: str) -> str:
    _require_configured()
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{settings.OPENAI_BASE_URL}/audio/transcriptions",
            headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
            data={"model": settings.OPENAI_TRANSCRIPTION_MODEL},
            files={"file": (filename, file_bytes)},
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Transcription provider error: {response.text}")
    return response.json()["text"]


def serialize_embedding(embedding: list[float]) -> str:
    return json.dumps(embedding)


def deserialize_embedding(embedding_json: str) -> list[float]:
    return json.loads(embedding_json)


def cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
