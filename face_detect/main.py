import os
import io
import numpy as np
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace
from typing import Tuple
from numpy.linalg import norm

app = FastAPI()

# Allow CORS for testing purposes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory to store embeddings
EMBEDDINGS_DIR = "embeddings"
os.makedirs(EMBEDDINGS_DIR, exist_ok=True)

def save_embedding(user_id: str, embedding: np.ndarray):
    path = os.path.join(EMBEDDINGS_DIR, f"{user_id}.npy")
    np.save(path, embedding)

def load_embeddings() -> dict:
    embeddings = {}
    for fname in os.listdir(EMBEDDINGS_DIR):
        if fname.endswith(".npy"):
            user_id = fname[:-4]
            emb = np.load(os.path.join(EMBEDDINGS_DIR, fname))
            embeddings[user_id] = emb
    return embeddings

def find_best_match(query_emb: np.ndarray) -> Tuple[str, float]:
    embeddings = load_embeddings()
    best_user, best_score = None, -1.0
    # cosine similarity
    for user_id, emb in embeddings.items():
        score = float(np.dot(query_emb, emb) / (norm(query_emb) * norm(emb)))
        if score > best_score:
            best_score, best_user = score, user_id
    return best_user, best_score

@app.post("/register")
async def register_face(user_id: str = Form(...), file: UploadFile = File(...)):
    contents = await file.read()
    try:
        # Represent returns list of dicts with 'embedding'
        objs = DeepFace.represent(img_path = io.BytesIO(contents), model_name="Facenet")
        embedding = np.array(objs[0]["embedding"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Face processing error: {e}")
    save_embedding(user_id, embedding)
    return JSONResponse({"status": "registered", "user_id": user_id})

@app.post("/match")
async def match_face(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        objs = DeepFace.represent(img_path = io.BytesIO(contents), model_name="Facenet")
        query_emb = np.array(objs[0]["embedding"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Face processing error: {e}")
    best_user, confidence = find_best_match(query_emb)
    # Set your threshold for match
    threshold = 0.40  # cosine distance threshold can be tuned
    if confidence >= threshold:
        return JSONResponse({"matched": True, "user_id": best_user, "confidence": confidence})
    else:
        return JSONResponse({"matched": False}, status_code=200)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
