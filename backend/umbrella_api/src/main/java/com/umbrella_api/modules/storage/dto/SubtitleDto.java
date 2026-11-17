package com.umbrella_api.modules.storage.dto;

import com.umbrella_api.modules.storage.model.Subtitle;

/**
 * Uma legenda (normal ou Libras) exposta ao app: estado, URL pública (se houver)
 * e o conteúdo SRT inline (fonte de verdade consultável).
 */
public record SubtitleDto(
        String kind,
        String status,
        String url,
        String content,
        String error) {

    public static SubtitleDto fromEntity(Subtitle s) {
        if (s == null) {
            return null;
        }
        return new SubtitleDto(
                s.getKind() != null ? s.getKind().name() : null,
                s.getStatus() != null ? s.getStatus().name() : null,
                s.getUrl(),
                s.getContent(),
                s.getError());
    }
}
