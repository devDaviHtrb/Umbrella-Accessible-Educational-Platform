"""
Núcleo da geração de legendas (normal + Libras) a partir de um vídeo.

Separa a LÓGICA (transcrição Whisper + 2 prompts Gemini) do transporte, para
que possa ser usada tanto pelo worker HTTP (server.py) quanto pela CLI
(main.py). Não imprime nada em stdout: devolve/retorna strings.
"""

import os
import re
import tempfile


def _limpa_srt(texto):
    if not texto:
        raise RuntimeError("O Gemini retornou uma resposta vazia.")
    texto = texto.strip()
    texto = re.sub(r"\A```(?:srt)?\s*", "", texto, flags=re.IGNORECASE)
    texto = re.sub(r"\s*```\Z", "", texto)
    return texto.strip()


# Modelo Whisper carregado uma vez e reutilizado entre requisições (caro).
_WHISPER_MODEL = None


def _get_model(model_name="small"):
    global _WHISPER_MODEL
    if _WHISPER_MODEL is None:
        import whisper

        _WHISPER_MODEL = whisper.load_model(model_name)
    return _WHISPER_MODEL


def transcrever(video_path, log=print):
    """Transcreve o áudio do vídeo em PT e devolve o SRT bruto (texto)."""
    from whisper.utils import get_writer

    log("Whisper: carregando modelo…")
    model = _get_model()

    log(f"Whisper: transcrevendo {video_path} …")
    result = model.transcribe(video_path, language="pt", verbose=False)

    base = os.path.splitext(os.path.basename(video_path))[0]
    with tempfile.TemporaryDirectory() as tmp:
        srt_writer = get_writer("srt", output_dir=tmp)
        srt_writer(result, video_path, {})
        raw_path = os.path.join(tmp, f"{base}.srt")
        with open(raw_path, "r", encoding="utf-8") as fp:
            return fp.read()


def gerar_legendas(legenda_original, gemini_key, log=print):
    """Devolve (legenda_normal, legenda_libras) usando o Gemini."""
    from google import genai

    log("Gemini: gerando legenda normal e Libras…")
    client = genai.Client(api_key=gemini_key)

    prompt_normal = f"""
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
    resp_normal = client.models.generate_content(
        model="gemini-2.5-flash", contents=prompt_normal
    )
    legenda_normal = _limpa_srt(resp_normal.text)

    prompt_libras = f"""
Atue como tradutor e intérprete profissional de Libras (Língua Brasileira de Sinais), especialista em adaptar texto em português para a estrutura de Libras, que será interpretada por um avatar sinalizador.

Abaixo está uma legenda SRT em português. Produza uma NOVA legenda SRT adaptada para Libras, destinada a um tradutor automático português→Libras. O avatar vai sinalizar o TEXTO de cada bloco, então o texto deve ser uma frase em português já adaptada à lógica de Libras.

Diretrizes OBRIGATÓRIAS:

1. COBERTURA TOTAL: A legenda adaptada DEVE cobrir o vídeo INTEIRO, do primeiro ao último bloco de tempo. NÃO descarte trechos nem pare no meio: todo o conteúdo falado precisa ter tradução correspondente, do início ao fim.
2. ADAPTAÇÃO PARA LIBRAS: Reescreva cada trecho na estrutura da Libras — ordem direta (tópico-comentário), frases curtas e objetivas, verbos no infinitivo/presente, sem artigos, preposições e conectivos desnecessários (de, a, o, que, para...). Mantenha o SENTIDO completo; simplifique a forma, não o conteúdo.
3. AGRUPAMENTO DE TEMPO: Você PODE unir blocos consecutivos com pouca pausa num bloco maior (recalculando início/fim para englobar os blocos unidos), para dar tempo de sinalização. Mas a sequência de tempos deve permanecer contínua e cobrir toda a duração original (o último bloco deve terminar no mesmo tempo do último bloco original, ou muito próximo).
4. NOMES PRÓPRIOS: Reduza nomes próprios longos a uma forma curta quando possível, mas sem perder quem/o quê está sendo referido.
5. ESTRUTURA SRT: Saída deve ser um SRT válido — blocos numerados em sequência (1, 2, 3...), linha de tempo "HH:MM:SS,mmm --> HH:MM:SS,mmm", texto, linha em branco entre blocos. Os tempos não podem se sobrepor nem retroceder.
6. FORMATO DE SAÍDA: Devolva APENAS o código SRT final, sem introduções, sem explicações e sem cercas de código (```).

Legenda em português para adaptar para Libras (cobrir até o final):
{legenda_normal}
"""
    # max_output_tokens alto para não truncar o fim da legenda (cobertura total).
    resp_libras = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt_libras,
        config={"max_output_tokens": 32768, "temperature": 0.3},
    )
    legenda_libras = _limpa_srt(resp_libras.text)

    return legenda_normal, legenda_libras


def gerar_de_video(video_path, gemini_key, log=print):
    """Pipeline completo: devolve (legenda_normal, legenda_libras)."""
    legenda_original = transcrever(video_path, log=log)
    return gerar_legendas(legenda_original, gemini_key, log=log)
