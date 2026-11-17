package com.umbrella_api.modules.storage.dto;

import java.util.List;

import com.umbrella_api.modules.storage.model.Subtitle;
import com.umbrella_api.modules.storage.model.SubtitleKind;
import com.umbrella_api.modules.storage.model.Video;

/**
 * Vídeo da aula com suas duas legendas (normal e Libras) e os respectivos
 * estados, consumido pelo player de Libras do app.
 */
public record VideoWithSubtitlesDto(
        Long videoId,
        String videoUrl,
        Double duration,
        SubtitleDto normal,
        SubtitleDto libras) {

    public static VideoWithSubtitlesDto of(Video video, List<Subtitle> subtitles) {
        Subtitle normal = pick(subtitles, SubtitleKind.NORMAL);
        Subtitle libras = pick(subtitles, SubtitleKind.LIBRAS);
        return new VideoWithSubtitlesDto(
                video.getId(),
                video.getUrl(),
                video.getDuration(),
                SubtitleDto.fromEntity(normal),
                SubtitleDto.fromEntity(libras));
    }

    private static Subtitle pick(List<Subtitle> subs, SubtitleKind kind) {
        if (subs == null) {
            return null;
        }
        return subs.stream().filter(s -> s.getKind() == kind).findFirst().orElse(null);
    }
}
