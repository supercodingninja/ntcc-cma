"""
This Area Of Code Is: FastAPI Backend for Music File Conversion
Explanation: This Python server receives .sib files, converts them to MusicXML using MuseScore (mscore),
             and returns the converted file. It runs on Render.com and handles CORS for the frontend.
In Other Words: This is the server that does the actual file conversion work.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import subprocess
import shutil
from pathlib import Path
import uuid
import logging

# Setup logging so we can see what's happening
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

"""
This Area Of Code Is: FastAPI App Creation
Explanation: Creates the web application with title and CORS settings.
             CORS allows the frontend at praises.team to talk to this backend.
In Other Words: Sets up the server and allows the church app to connect to it.
"""
app = FastAPI(title="NTCC Music Converter API")

# Allow requests from the church website and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://praises.team",           # Production frontend
        "https://www.myntcc.org",         # Church website
        "http://localhost:3000",          # Local development
        "http://localhost:5173",          # Vite dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],                  # Allow all HTTP methods
    allow_headers=["*"],                  # Allow all headers
)

"""
This Area Of Code Is: Directory Setup
Explanation: Creates folders for uploaded files and converted files if they don't exist.
             Files are stored temporarily and cleaned up after conversion.
In Other Words: Makes folders to hold files while converting them.
"""
UPLOAD_DIR = Path("uploads")
CONVERTED_DIR = Path("converted")
UPLOAD_DIR.mkdir(exist_ok=True)
CONVERTED_DIR.mkdir(exist_ok=True)

"""
This Area Of Code Is: Health Check Endpoint
Explanation: Simple endpoint to check if the server is running.
             Returns a message confirming the API is up.
             THIS IS WHAT UPTIMEROBOT WILL PING EVERY 10 MINUTES!
In Other Words: Lets you check if the converter is working.
"""
@app.get("/")
async def root():
    return {
        "message": "NTCC Music Converter API",
        "status": "running",
        "converter": "MuseScore (mscore)"
    }

"""
This Area Of Code Is: Sibelius to MusicXML Conversion Endpoint
Explanation: Receives a .sib file, validates it, saves it temporarily,
             runs MuseScore to convert it to MusicXML, then returns the result.
             Cleans up temporary files after conversion.
In Other Words: Takes your Sibelius file, converts it, and gives back the MusicXML.
"""
@app.post("/convert/sib-to-musicxml")
async def convert_sib_to_musicxml(file: UploadFile = File(...)):
    
    # Validate file extension (case-insensitive)
    if not file.filename.lower().endswith('.sib'):
        logger.warning(f"Invalid file type: {file.filename}")
        raise HTTPException(
            status_code=400, 
            detail="File must be a .sib file (Sibelius score)"
        )
    
    # Create unique IDs so files don't overwrite each other
    conversion_id = str(uuid.uuid4())
    input_path = UPLOAD_DIR / f"{conversion_id}.sib"
    output_path = CONVERTED_DIR / f"{conversion_id}.musicxml"
    
    try:
        # Save uploaded file to disk
        logger.info(f"Receiving file: {file.filename} (ID: {conversion_id})")
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"Converting {file.filename} using MuseScore...")
        
        # Run MuseScore command-line tool to convert
        # mscore -o output.musicxml input.sib
        cmd = ["mscore", "-o", str(output_path), str(input_path)]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        # Check if conversion succeeded
        if result.returncode != 0:
            logger.error(f"Conversion failed: {result.stderr}")
            raise HTTPException(
                status_code=500, 
                detail=f"Conversion failed: {result.stderr}"
            )
        
        # Verify output file was created
        if not output_path.exists():
            logger.error("Output file not created")
            raise HTTPException(
                status_code=500, 
                detail="Conversion completed but output file not found"
            )
        
        logger.info(f"Conversion successful: {output_path}")
        
        # Return the converted file as a download
        return FileResponse(
            path=output_path,
            filename=file.name.replace('.sib', '.musicxml'),
            media_type="application/vnd.recordare.musicxml+xml"
        )
        
    except subprocess.TimeoutExpired:
        logger.error("Conversion timed out")
        raise HTTPException(
            status_code=504, 
            detail="Conversion timed out (took longer than 30 seconds)"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Server error: {str(e)}"
        )
    finally:
        # Cleanup: delete the input file (output file is sent as response)
        if input_path.exists():
            input_path.unlink()
            logger.info(f"Cleaned up: {input_path}")

"""
This Area Of Code Is: Server Startup
Explanation: When running this file directly (not imported), start the server
             on all network interfaces at port 8000.
In Other Words: Starts the server when you run the file.
"""
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
