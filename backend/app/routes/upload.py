from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os
from uuid import uuid4

router = APIRouter()

UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    try:
        file_ext = os.path.splitext(file.filename)[-1]
        filename = f"{uuid4().hex}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        return {"file_path": f"/{file_path}"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")