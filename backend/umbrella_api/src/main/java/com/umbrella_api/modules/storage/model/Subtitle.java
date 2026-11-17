package com.umbrella_api.modules.storage.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Legenda de um vídeo gerada automaticamente (transcrição Whisper + Gemini).
 *
 * Cada vídeo tem (até) duas: {@link SubtitleKind#NORMAL} (caption em português)
 * e {@link SubtitleKind#LIBRAS} (texto simplificado para o avatar VLibras). O
 * ciclo de vida é {@link SubtitleStatus#PROCESSING} → READY/FAILED.
 *
 * O conteúdo SRT é guardado inline em {@code content} (consulta direta pelo app)
 * e opcionalmente também publicado no Cloudinary ({@code url}/{@code fileDbId}).
 *
 * Nova tabela; o schema evolui via Hibernate ddl-auto=update sem afetar as
 * tabelas existentes.
 */
@Entity
@Table(name = "subtitles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Subtitle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubtitleKind kind;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubtitleStatus status;

    /** URL pública do .srt (Cloudinary), quando publicado. */
    @Column
    private String url;

    /** public_id no Cloudinary, para exclusão. */
    @Column
    private String fileDbId;

    /** Conteúdo SRT inline (fonte de verdade consultável pelo app). */
    @Column(columnDefinition = "text")
    private String content;

    /** Mensagem de erro quando {@code status == FAILED}. */
    @Column(columnDefinition = "text")
    private String error;

    /** Vídeo ao qual a legenda pertence. */
    @ManyToOne
    @JoinColumn(name = "video_id", nullable = false)
    @JsonIgnore
    private Video video;
}
