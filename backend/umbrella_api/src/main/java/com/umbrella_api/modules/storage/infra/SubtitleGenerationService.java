package com.umbrella_api.modules.storage.infra;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.umbrella_api.modules.ai.config.GeminiData;
import com.umbrella_api.modules.storage.config.TransformerProperties;
import com.umbrella_api.modules.storage.model.Subtitle;
import com.umbrella_api.modules.storage.model.SubtitleKind;
import com.umbrella_api.modules.storage.model.SubtitleStatus;
import com.umbrella_api.modules.storage.model.Video;
import com.umbrella_api.modules.storage.repository.SubtitleRepository;
import com.umbrella_api.modules.storage.repository.VideoRepository;

/**
 * Orquestra a geração automática das duas legendas (normal e Libras) de um
 * vídeo, chamando o worker Python (`transformer`) de forma assíncrona.
 *
 * Fluxo:
 *   1. Marca/recria as legendas NORMAL e LIBRAS como PROCESSING.
 *   2. Chama `POST {transformer}/generate` com a URL do vídeo (Cloudinary) e a
 *      chave do Gemini; o worker baixa o MP4, transcreve (Whisper) e gera os
 *      dois SRTs (Gemini), devolvendo-os como texto.
 *   3. Salva o conteúdo SRT inline e marca READY. Em erro, marca FAILED com a
 *      mensagem — SEM derromar o upload (é @Async e isolado em transação).
 *
 * Fallback: se o worker estiver indisponível, as legendas ficam FAILED e o
 * professor pode enviá-las manualmente (endpoint de upload de legenda).
 */
@Service
public class SubtitleGenerationService {

    private final VideoRepository videoRepository;
    private final SubtitleRepository subtitleRepository;
    private final TransformerProperties transformerProps;
    private final String geminiKey;
    private final WebClient webClient;

    public SubtitleGenerationService(
            VideoRepository videoRepository,
            SubtitleRepository subtitleRepository,
            TransformerProperties transformerProps,
            GeminiData geminiData) {
        this.videoRepository = videoRepository;
        this.subtitleRepository = subtitleRepository;
        this.transformerProps = transformerProps;
        // Chave DEDICADA do worker (transformer.geminiKey). Só cai para a chave
        // do tutor IA (geminiData) se a dedicada não estiver configurada.
        String dedicated = transformerProps.geminiKey();
        this.geminiKey = (dedicated != null && !dedicated.isBlank())
                ? dedicated
                : (geminiData.api() != null ? geminiData.api().key() : null);
        this.webClient = WebClient.builder()
                .baseUrl(transformerProps.baseUrl())
                .codecs(c -> c.defaultCodecs().maxInMemorySize(16 * 1024 * 1024))
                .build();
    }

    /** Vídeo + suas duas legendas (para o endpoint consumido pelo app). */
    public com.umbrella_api.modules.storage.dto.VideoWithSubtitlesDto getVideoWithSubtitles(Long videoId) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Vídeo não encontrado: " + videoId));
        return com.umbrella_api.modules.storage.dto.VideoWithSubtitlesDto.of(
                video, subtitleRepository.findByVideoId(videoId));
    }

    /** Salva/atualiza manualmente uma legenda (fallback quando o worker falha). */
    public void saveManual(Long videoId, SubtitleKind kind, String srt) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Vídeo não encontrado: " + videoId));
        Subtitle sub = upsert(video, kind);
        ready(sub, srt);
    }

    /**
     * Dispara (assíncrono) a geração das duas legendas para o vídeo informado.
     * Retorna imediatamente ao chamador (ex.: o upload).
     */
    @Async
    public void generateForVideo(Long videoId) {
        Optional<Video> maybeVideo = videoRepository.findById(videoId);
        if (maybeVideo.isEmpty()) {
            return;
        }
        Video video = maybeVideo.get();

        Subtitle normal = upsert(video, SubtitleKind.NORMAL);
        Subtitle libras = upsert(video, SubtitleKind.LIBRAS);

        if (geminiKey == null || geminiKey.isBlank()) {
            fail(normal, "GEMINI_API_KEY ausente no backend.");
            fail(libras, "GEMINI_API_KEY ausente no backend.");
            return;
        }
        if (video.getUrl() == null || video.getUrl().isBlank()) {
            fail(normal, "Vídeo sem URL pública para processar.");
            fail(libras, "Vídeo sem URL pública para processar.");
            return;
        }

        try {
            Map<String, Object> body = Map.of(
                    "videoUrl", video.getUrl(),
                    "geminiKey", geminiKey);

            @SuppressWarnings("unchecked")
            Map<String, String> result = webClient.post()
                    .uri("/generate")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(Duration.ofSeconds(transformerProps.timeoutSeconds()));

            String normalSrt = result != null ? result.get("normal") : null;
            String librasSrt = result != null ? result.get("libras") : null;

            if (normalSrt == null || librasSrt == null) {
                fail(normal, "Worker não retornou a legenda normal.");
                fail(libras, "Worker não retornou a legenda Libras.");
                return;
            }

            ready(normal, normalSrt);
            ready(libras, librasSrt);
        } catch (Exception e) {
            String msg = "Falha ao gerar legendas: " + e.getMessage();
            fail(normal, msg);
            fail(libras, msg);
        }
    }

    // NOTE: these helpers are called via self-invocation from the @Async method,
    // so a method-level @Transactional here would NOT be applied by the proxy.
    // Each subtitleRepository.save() already runs in its own Spring Data
    // transaction, which is sufficient (each persists one row independently).

    /** Cria (ou reusa) a legenda do tipo dado e a marca PROCESSING. */
    private Subtitle upsert(Video video, SubtitleKind kind) {
        Subtitle sub = subtitleRepository
                .findByVideoIdAndKind(video.getId(), kind)
                .orElseGet(() -> Subtitle.builder().video(video).kind(kind).build());
        sub.setStatus(SubtitleStatus.PROCESSING);
        sub.setError(null);
        return subtitleRepository.save(sub);
    }

    private void ready(Subtitle sub, String srt) {
        sub.setContent(srt);
        sub.setStatus(SubtitleStatus.READY);
        sub.setError(null);
        subtitleRepository.save(sub);
    }

    private void fail(Subtitle sub, String error) {
        sub.setStatus(SubtitleStatus.FAILED);
        sub.setError(error);
        subtitleRepository.save(sub);
    }
}
