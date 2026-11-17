# Worker de geração de legendas (Whisper + Gemini).
# Imagem separada do backend Java para isolar o peso do Whisper/torch.
FROM python:3.11-slim

# ffmpeg é obrigatório para o Whisper extrair o áudio do vídeo.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
# torch (puxado pelo openai-whisper) é grande; este passo é demorado.
RUN pip install --no-cache-dir -r requirements.txt

COPY subtitle_core.py server.py main.py ./

EXPOSE 8000

# Um worker só: a transcrição é pesada em CPU e o modelo Whisper é mantido em
# memória entre requisições (ver subtitle_core._get_model).
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
