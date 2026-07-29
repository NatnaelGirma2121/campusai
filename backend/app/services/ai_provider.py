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
            f"{settings.openai_base_url_normalized}/embeddings",
            headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
            json={"model": settings.OPENAI_EMBEDDING_MODEL, "input": text},
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Embedding provider error ({response.status_code}): {response.text or '(empty response body)'}")
    return response.json()["data"][0]["embedding"]


async def get_chat_completion(system_prompt: str, user_message: str) -> str:
    _require_configured()
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{settings.openai_base_url_normalized}/chat/completions",
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
        raise HTTPException(status_code=502, detail=f"Chat provider error ({response.status_code}): {response.text or '(empty response body)'}")
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
            f"{settings.openai_base_url_normalized}/chat/completions",
            headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
            json={"model": settings.OPENAI_CHAT_MODEL, "messages": messages, "temperature": 0.3},
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Chat provider error ({response.status_code}): {response.text or '(empty response body)'}")
    return response.json()["choices"][0]["message"]["content"]


_AUDIO_MIME_TYPES = {
    "webm": "audio/webm",
    "wav": "audio/wav",
    "mp3": "audio/mp3",
    "ogg": "audio/ogg",
    "m4a": "audio/m4a",
    "aac": "audio/aac",
    "flac": "audio/flac",
}


async def _transcribe_via_gemini_native(file_bytes: bytes, filename: str) -> str:
    """Gemini's OpenAI-compatible /audio/transcriptions-style endpoint only
    accepts wav/mp3 for input_audio — not webm, which is what browsers'
    MediaRecorder actually produces. Gemini's own native API has no such
    restriction (webm is natively supported), so for Gemini specifically we
    call that directly instead of pretending it's a generic OpenAI-compatible
    provider for this one capability."""
    import base64

    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else "webm"
    mime_type = _AUDIO_MIME_TYPES.get(extension, "audio/webm")
    encoded_audio = base64.b64encode(file_bytes).decode("utf-8")

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.OPENAI_CHAT_MODEL}:generateContent"
    )
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": (
                            "Transcribe this audio exactly, word for word. "
                            "Respond with only the transcription text, nothing else."
                        )
                    },
                    {"inline_data": {"mime_type": mime_type, "data": encoded_audio}},
                ]
            }
        ]
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            url,
            headers={"x-goog-api-key": settings.OPENAI_API_KEY, "Content-Type": "application/json"},
            json=payload,
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Transcription provider error ({response.status_code}): {response.text or '(empty response body)'}")

    data = response.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError):
        raise HTTPException(status_code=502, detail="Transcription provider returned an unexpected response.")


async def transcribe_audio(file_bytes: bytes, filename: str) -> str:
    _require_configured()

    if "generativelanguage.googleapis.com" in settings.OPENAI_BASE_URL:
        return await _transcribe_via_gemini_native(file_bytes, filename)

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{settings.openai_base_url_normalized}/audio/transcriptions",
            headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
            data={"model": settings.OPENAI_TRANSCRIPTION_MODEL},
            files={"file": (filename, file_bytes)},
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Transcription provider error ({response.status_code}): {response.text or '(empty response body)'}")
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
