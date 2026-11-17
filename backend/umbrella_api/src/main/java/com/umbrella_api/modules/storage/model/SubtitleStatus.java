package com.umbrella_api.modules.storage.model;

/** Estado do processamento de uma legenda gerada automaticamente. */
public enum SubtitleStatus {
    /** Geração em andamento (transcrição + tradução). */
    PROCESSING,
    /** Concluída: conteúdo/URL disponíveis. */
    READY,
    /** Falhou: ver campo `error`. */
    FAILED
}
