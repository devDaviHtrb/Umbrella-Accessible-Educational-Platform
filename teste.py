import os
import re
import whisper
from whisper.utils import get_writer
from google import genai
import ffmpeg

# ==============================================================================
# CONFIGURAÇÕES INICIAIS
# ==============================================================================
NOME_DO_VIDEO = "video.mp4"                   # Nome do seu arquivo de vídeo original
CHAVE_API_GEMINI = "AIzaSyBN9FyaEGsDx6IVKlPvzfpm9QSOg9_6Lfs"        # Cole sua chave do Gemini aqui

# Nomes dos arquivos temporários que o script vai gerenciar automaticamente
NOME_BASE = os.path.splitext(NOME_DO_VIDEO)[0]
ARQUIVO_SRT_BRUTO = f"{NOME_BASE}.srt"
ARQUIVO_SRT_CORRIGIDO = f"{NOME_BASE}_corrigido.srt"
VIDEO_LEGENDADO_FINAL = f"{NOME_BASE}_legendado_final.mp4"

# ==============================================================================
# ETAPA 1: EXECUÇÃO DO WHISPER (ÁUDIO PARA TEXTO)
# ==============================================================================
print("--- ETAPA 1: Carregando o modelo Whisper... ---")
model = whisper.load_model("small")

print(f"Transcrevendo o arquivo '{NOME_DO_VIDEO}' em Português...")
result = model.transcribe(NOME_DO_VIDEO, language="pt", verbose=True)

print("Gerando arquivo de legenda SRT bruto...")
srt_writer = get_writer("srt", output_dir=".")
srt_writer(result, NOME_DO_VIDEO, {}) 
# O Whisper salva automaticamente com o nome do vídeo + .srt (ex: video.srt)

# ==============================================================================
# ETAPA 2: CORREÇÃO E FORMALIZAÇÃO COM O GEMINI
# ==============================================================================
print("\n--- ETAPA 2: Enviando para o Gemini formalizar... ---")
client = genai.Client(api_key=CHAVE_API_GEMINI)

# Lê o arquivo que o Whisper acabou de criar
with open(ARQUIVO_SRT_BRUTO, "r", encoding="utf-8") as f:
    legenda_original = f.read()

prompt_comando = f"""
Atue como um revisor de texto profissional e especialista em legendagem.
Abaixo está uma legenda SRT gerada por inteligência artificial de áudio para texto.
Ela contém erros de ortografia, palavras foneticamente parecidas que foram trocadas erroneamente e ruídos de transcrição nos primeiros segundos.

Sua tarefa:
1. Corrija o português, a concordância, os erros de digitação e remova palavras sem sentido (como ruídos de início ou falhas de detecção).
2. Tente deduzir o sentido correto das frases com base no contexto geral do texto.
3. MANTENHA RIGOROSAMENTE INTACTAS as numerações dos blocos e os códigos de tempo (ex: 00:00:30,000 --> 00:00:37,000). Não altere nenhum número ou seta.
4. Devolva APENAS o código SRT final corrigido, sem introduções, aspas de bloco de código ou explicações.

Aqui está a legenda para corrigir:
{legenda_original}
"""

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=prompt_comando,
)

# Limpa possíveis blocos de markdown (como ```srt ... ```) que o Gemini possa retornar
texto_final = response.text.replace("```srt", "").replace("```", "").strip()

# Salva a legenda perfeitamente corrigida
with open(ARQUIVO_SRT_CORRIGIDO, "w", encoding="utf-8") as f:
    f.write(texto_final)

print(f"Legenda formalizada com sucesso e salva em '{ARQUIVO_SRT_CORRIGIDO}'.")

# ==============================================================================
# ETAPA 3: IMPRESSÃO DA LEGENDA NO VÍDEO (FFMPEG)
# ==============================================================================
print("\n--- ETAPA 3: Imprimindo a legenda no vídeo via FFmpeg... ---")
print("Isso pode demorar alguns minutos dependendo do tamanho do vídeo.")

# Margem vertical de 60px configurada para a legenda não ficar embaixo do VLibras
estilo_legenda = "FontSize=14,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=4,MarginV=60"

try:
    (
        ffmpeg
        .input(NOME_DO_VIDEO)
        .output(VIDEO_LEGENDADO_FINAL, vf=f"subtitles={ARQUIVO_SRT_CORRIGIDO}:force_style='{estilo_legenda}'")
        .overwrite_output()
        .run(capture_stdout=True, capture_stderr=True)
    )
    print(f"\n[SUCESSO] Vídeo renderizado com sucesso: '{VIDEO_LEGENDADO_FINAL}'")
    print("Pronto para ser enviado ao seu Bucket e os dados irem para o banco!")

except ffmpeg.Error as e:
    print("\n[ERRO] Falha ao renderizar o vídeo com o FFmpeg.")
    print("Detalhes do erro:", e.stderr.decode('utf-8'))
