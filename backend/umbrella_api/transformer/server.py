"""
Worker HTTP de geração de legendas (transformer).

Serviço interno à rede do docker-compose. O backend Java chama
`POST /generate` com a URL do vídeo (Cloudinary); o worker baixa o MP4,
transcreve com Whisper e gera as duas legendas (normal e Libras) com o Gemini,
devolvendo-as como texto SRT no corpo JSON.

Endpoints:
  GET  /health   -> { "status": "ok" }
  POST /generate -> body { "videoUrl": "...", "geminiKey": "..."(opcional) }
                    200 { "normal": "<srt>", "libras": "<srt>" }
                    4xx/5xx { "error": "..." }

A chave do Gemini vem do corpo OU da variável de ambiente GEMINI_API_KEY.
Este endpoint NÃO é exposto fora da rede do compose (sem autenticação própria);
é um worker interno acionado apenas pelo backend.
"""

import os
import tempfile
import urllib.request

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from subtitle_core import gerar_de_video

app = FastAPI(title="Umbrella Subtitle Worker")


class GenerateRequest(BaseModel):
    videoUrl: str
    geminiKey: str | None = None


class GenerateResponse(BaseModel):
    normal: str
    libras: str


@app.get("/health")
def health():
    return {"status": "ok"}


def _download(url: str, dest_path: str) -> None:
    # Baixa o vídeo da URL pública (Cloudinary) para um arquivo local.
    req = urllib.request.Request(url, headers={"User-Agent": "umbrella-transformer"})
    with urllib.request.urlopen(req, timeout=120) as resp, open(dest_path, "wb") as out:
        while True:
            chunk = resp.read(1024 * 256)
            if not chunk:
                break
            out.write(chunk)


@app.post("/generate", response_model=GenerateResponse)
def generate(body: GenerateRequest):
    gemini_key = body.geminiKey or os.environ.get("GEMINI_API_KEY", "")
    if not gemini_key:
        raise HTTPException(status_code=400, detail="GEMINI_API_KEY ausente.")
    if not body.videoUrl:
        raise HTTPException(status_code=400, detail="videoUrl ausente.")

    with tempfile.TemporaryDirectory() as tmp:
        video_path = os.path.join(tmp, "video.mp4")
        try:
            _download(body.videoUrl, video_path)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(
                status_code=400, detail=f"Falha ao baixar vídeo: {exc}"
            ) from exc

        try:
            normal, libras = gerar_de_video(video_path, gemini_key)
        except Exception as exc:  # noqa: BLE001
            import traceback

            tb = traceback.format_exc()
            print("ERRO na geração de legendas:\n" + tb, flush=True)
            raise HTTPException(
                status_code=500, detail=f"Falha na geração de legendas: {exc}"
            ) from exc

    return GenerateResponse(normal=normal, libras=libras)
