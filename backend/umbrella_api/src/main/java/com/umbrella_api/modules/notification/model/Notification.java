package com.umbrella_api.modules.notification.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Notificação por usuário. Armazena mensagens recebidas e novos materiais,
 * vídeos e atividades nos cursos em que o usuário está matriculado.
 *
 * Segue o padrão do projeto de usar IDs crus (userId, courseId) em vez de
 * @ManyToOne, como MessageModel. Nova tabela; o schema é criado por
 * ddl-auto=update.
 */
@Entity
@Table(name = "notifications")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Destinatário da notificação. */
    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "text")
    private String body;

    /** Curso relacionado (quando aplicável: material/vídeo/atividade). */
    @Column
    private Long courseId;

    /** Id da entidade de origem (mensagem, material, atividade), para navegar. */
    @Column
    private Long referenceId;

    @Column(nullable = false)
    private boolean read;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
