from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import subprocess
import shutil
from pathlib import Path
import uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="NTCC Music Converter API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://praises.team", "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
CONVERTED_DIR = Path("converted")
UPLOAD_DIR.mkdir(exist_ok=True)
CONVERTED_DIR.mkdir(exist_ok=True)

@app.get("/")
async def root():
    return {"message": "NTCC Music Converter API", "status": "running"}

@app.post("/convert/sib-to-musicxml")
async def convert_sib_to_musicxml(file: UploadFile = File(...)):
    if not file.filename.endswith('.sib'):
        raise HTTPException(status_code=400, detail="File must be a .sib file")
    
    conversion_id = str(uuid.uuid4())
    input_path = UPLOAD_DIR / f"{conversion_id}.sib"
    output_path = CONVERTED_DIR / f"{conversion_id}.musicxml"
    
    try:
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"Converting {file.filename}")
        
        cmd = ["mscore", "-o", str(output_path), str(input_path)]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Conversion failed: {result.stderr}")
        
        if not output_path.exists():
            raise HTTPException(status_code=500, detail="Output file not created")
        
        return FileResponse(
            path=output_path,
            filename=file.filename.replace('.sib', '.musicxml'),
            media_type="application/vnd.recordare.musicxml+xml"
        )
        
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Conversion timed out")
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if input_path.exists():
            input_path.unlink()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
