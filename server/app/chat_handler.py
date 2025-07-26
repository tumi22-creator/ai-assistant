from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    personality: str = None  # Optional personality prompt

@app.post("/chat")
async def chat(request: ChatRequest):
    user_message = request.message
    personality_prompt = request.personality or ""

    # Prepare messages for Ollama or your AI backend
    messages = []
    if personality_prompt:
        messages.append({"role": "system", "content": personality_prompt})
    messages.append({"role": "user", "content": user_message})

    try:
        response = requests.post(
            "http://localhost:11434/api/chat",
            json={
                "model": "llama3",
                "messages": messages,
            },
            timeout=30
        )
        response.raise_for_status()
        res_json = response.json()
        assistant_message = res_json.get("message", {}).get("content", "Sorry, no response.")
        return {"response": assistant_message}
    except Exception as e:
        return {"response": f"Error communicating with AI model: {str(e)}"}
