from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

app = FastAPI()

# CORS setup so your React frontend can call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat(request: ChatRequest):
    import json
    user_message = request.message

    try:
        with requests.post(
            "http://localhost:11434/api/chat",
            json={
                "model": "llama3",
                "messages": [{"role": "user", "content": user_message}],
                "stream": True
            },
            stream=True,
            timeout=60
        ) as response:
            response.raise_for_status()

            full_response = ""
            for line in response.iter_lines():
                if line:
                    try:
                        data = json.loads(line.decode("utf-8"))
                        content = data.get("message", {}).get("content")
                        if content:
                            full_response += content
                    except Exception:
                        continue

            return {"response": full_response or "No reply from model."}

    except Exception as e:
        return {"response": f"Error communicating with AI model: {str(e)}"}
