import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_roles
from app.models.document import Document
from app.models.user import User, UserRole
from app.schemas.document import DocumentCreate, DocumentRead
from app.services.document_ingestion import ingest_document
from app.services.file_extraction import extract_text

router = APIRouter(prefix="/documents", tags=["documents"])

# keep uploads reasonable for a chat/study-tools knowledge base — large files
# should be split into multiple, more focused documents instead
MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB


@router.post(
    "/",
    response_model=DocumentRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(UserRole.teacher, UserRole.admin))],
)
async def upload_document(
    payload: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DocumentRead:
    document, chunk_count = await ingest_document(
        db,
        title=payload.title,
        content=payload.content,
        department_id=payload.department_id,
        course_id=payload.course_id,
        uploaded_by_id=current_user.id,
    )
    result = DocumentRead.model_validate(document)
    result.chunk_count = chunk_count
    return result


@router.post(
    "/upload-file",
    response_model=DocumentRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(UserRole.teacher, UserRole.admin))],
)
async def upload_document_file(
    title: str = Form(...),
    department_id: uuid.UUID | None = Form(default=None),
    course_id: uuid.UUID | None = Form(default=None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DocumentRead:
    """Accepts a PDF or PPTX file, extracts its text, then goes through the
    same chunk/embed pipeline as the raw-text upload route."""
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 15 MB).")
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    content = extract_text(file.filename, file_bytes)

    document, chunk_count = await ingest_document(
        db,
        title=title,
        content=content,
        department_id=department_id,
        course_id=course_id,
        uploaded_by_id=current_user.id,
    )
    result = DocumentRead.model_validate(document)
    result.chunk_count = chunk_count
    return result


@router.get("/", response_model=list[DocumentRead])
def list_documents(
    department_id: uuid.UUID | None = Query(default=None),
    course_id: uuid.UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> list[DocumentRead]:
    query = db.query(Document)
    if department_id:
        query = query.filter(Document.department_id == department_id)
    if course_id:
        query = query.filter(Document.course_id == course_id)

    results = []
    for doc in query.order_by(Document.created_at.desc()).all():
        item = DocumentRead.model_validate(doc)
        item.chunk_count = len(doc.chunks)
        results.append(item)
    return results
