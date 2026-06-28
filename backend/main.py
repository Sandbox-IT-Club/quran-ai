import os
import time
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from openai import OpenAI

app = FastAPI(title="Hifz AI Evaluation Server")

# Initialize AI client - Expects your token in system environment
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "mock-key-for-now"))

# Initial database snippet tracking the precise text of the Quran
QURAN_DATABASE = {
    "1:1": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    "1:2": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ"
}

class HelpRequest(BaseModel):
    surah_ayah: str
    silence_duration_seconds: float

@app.post("/api/v1/recite")
async def evaluate_recitation(surah_ayah: str = Form(...), audio_file: UploadFile = File(...)):
    temp_filename = f"temp_{int(time.time())}_{audio_file.filename}"
    with open(temp_filename, "wb") as f:
        f.write(await audio_file.read())
        
    try:
        # In a real run, this sends audio to OpenAI Whisper for Arabic transcription
        # For our local simulator, we will use text parsing mock verification
        correct_text = QURAN_DATABASE.get(surah_ayah, "")
        if not correct_text:
            raise HTTPException(status_code=404, detail="Surah/Ayah reference index not found.")

        return {
            "status": "Processed",
            "message": "Audio payload verified. Endpoint ready for OpenAI API Key link."
        }
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

@app.post("/api/v1/stuck-hint")
async def trigger_stuck_hint(request: HelpRequest):
    correct_verse = QURAN_DATABASE.get(request.surah_ayah, "Verse reference invalid.")
    words = correct_verse.split()
    hint_snippet = " ".join(words[:2]) if len(words) >= 2 else correct_verse
    
    if request.silence_duration_seconds >= 300: # 5 minutes threshold
        return {
            "status": "Timeout Triggered",
            "message": f"You have been silent for 5 minutes. Your hint: '{hint_snippet}...'"
        }
    return {
        "status": "Manual Assist",
        "message": f"Don't worry. The Ayah begins with: '{hint_snippet}'"
    }
