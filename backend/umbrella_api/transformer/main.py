"""
CLI de geração de legendas (para testes locais, fora do worker HTTP).

    python main.py <video_path> <gemini_key> <out_dir>

Escreve <base>_corrigido.srt e <base>_libras.srt em <out_dir> e imprime no
stdout (contrato):
    NORMAL_SRT=<caminho absoluto>
    LIBRAS_SRT=<caminho absoluto>
Erros vão para stderr com exit != 0. A lógica real está em subtitle_core.py
(a mesma usada pelo worker server.py).
"""

import os
import sys

from subtitle_core import gerar_de_video


def main(argv):
    if len(argv) != 4:
        raise SystemExit("Uso: python main.py <video_path> <gemini_key> <out_dir>")
    video_path, gemini_key, out_dir = argv[1], argv[2], argv[3]
    if not os.path.isfile(video_path):
        raise SystemExit(f"Vídeo não encontrado: {video_path}")
    if not gemini_key:
        raise SystemExit("Chave do Gemini vazia.")
    os.makedirs(out_dir, exist_ok=True)

    base = os.path.splitext(os.path.basename(video_path))[0]
    normal, libras = gerar_de_video(
        video_path, gemini_key, log=lambda m: print(m, file=sys.stderr)
    )

    caminho_normal = os.path.abspath(os.path.join(out_dir, f"{base}_corrigido.srt"))
    caminho_libras = os.path.abspath(os.path.join(out_dir, f"{base}_libras.srt"))
    with open(caminho_normal, "w", encoding="utf-8") as fp:
        fp.write(normal)
    with open(caminho_libras, "w", encoding="utf-8") as fp:
        fp.write(libras)

    print(f"NORMAL_SRT={caminho_normal}")
    print(f"LIBRAS_SRT={caminho_libras}")


if __name__ == "__main__":
    try:
        main(sys.argv)
    except SystemExit:
        raise
    except Exception as exc:  # noqa: BLE001
        print(f"ERRO: {exc}", file=sys.stderr)
        sys.exit(1)
