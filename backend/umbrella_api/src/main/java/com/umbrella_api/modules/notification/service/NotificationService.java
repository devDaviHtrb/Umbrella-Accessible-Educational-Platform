package com.umbrella_api.modules.notification.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.umbrella_api.modules.course.repository.CourseUserRelationRepository;
import com.umbrella_api.modules.notification.dto.NotificationDto;
import com.umbrella_api.modules.notification.infra.ExpoPushService;
import com.umbrella_api.modules.notification.model.Notification;
import com.umbrella_api.modules.notification.model.NotificationType;
import com.umbrella_api.modules.notification.repository.NotificationRepository;
import com.umbrella_api.modules.user.model.UserModel;

/**
 * Cria notificações por usuário, persistindo-as e disparando (a) push para o
 * celular via Expo e (b) entrega em tempo real via WebSocket. Expõe atalhos
 * para os três eventos: mensagem recebida, novo material/vídeo e nova atividade.
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final CourseUserRelationRepository courseUserRelationRepository;
    private final ExpoPushService expoPushService;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(
            NotificationRepository notificationRepository,
            CourseUserRelationRepository courseUserRelationRepository,
            ExpoPushService expoPushService,
            SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.courseUserRelationRepository = courseUserRelationRepository;
        this.expoPushService = expoPushService;
        this.messagingTemplate = messagingTemplate;
    }

    /** Cria e entrega uma notificação para um único usuário. */
    @Transactional
    public void notifyUser(Long userId, NotificationType type, String title, String body,
            Long courseId, Long referenceId) {
        if (userId == null) {
            return;
        }
        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .body(body)
                .courseId(courseId)
                .referenceId(referenceId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notification = notificationRepository.save(notification);

        // Tempo real (app aberto): /user/{id}/queue/notifications
        try {
            messagingTemplate.convertAndSendToUser(
                    userId.toString(), "/queue/notifications", NotificationDto.fromEntity(notification));
        } catch (Exception ignored) {
            // Entrega em tempo real é best-effort.
        }

        // Push no celular (app em background/fechado), assíncrono.
        expoPushService.sendToUser(userId, title, body, Map.of(
                "type", type.name(),
                "courseId", courseId != null ? courseId : -1,
                "referenceId", referenceId != null ? referenceId : -1));
    }

    /** Notifica todos os ALUNOS matriculados de um curso (exceto um opcional). */
    public void notifyCourseStudents(Long courseId, Long excludeUserId, NotificationType type,
            String title, String body, Long referenceId) {
        if (courseId == null) {
            return;
        }
        List<UserModel> students = courseUserRelationRepository.findStudentsByCourseId(courseId);
        for (UserModel student : students) {
            if (student == null || student.getId() == null) {
                continue;
            }
            if (excludeUserId != null && student.getId().equals(excludeUserId)) {
                continue;
            }
            notifyUser(student.getId(), type, title, body, courseId, referenceId);
        }
    }

    // ── Atalhos por evento ───────────────────────────────────────────────

    public void notifyMessage(Long recipientId, Long senderId, String content, Long messageId) {
        String preview = content != null && content.length() > 80 ? content.substring(0, 80) + "…" : content;
        notifyUser(recipientId, NotificationType.MESSAGE, "Nova mensagem", preview, null, messageId);
    }

    public void notifyNewMaterial(Long courseId, String materialTitle, boolean isVideo, Long materialId) {
        NotificationType type = isVideo ? NotificationType.VIDEO : NotificationType.MATERIAL;
        String title = isVideo ? "Novo vídeo no curso" : "Novo material no curso";
        notifyCourseStudents(courseId, null, type, title, materialTitle, materialId);
    }

    public void notifyNewActivity(Long courseId, String activityTitle, Long activityId) {
        notifyCourseStudents(courseId, null, NotificationType.ACTIVITY, "Nova atividade", activityTitle, activityId);
    }

    // ── Leitura / gestão ─────────────────────────────────────────────────

    public List<NotificationDto> listForUser(Long userId) {
        return NotificationDto.fromList(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    public long unreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markRead(Long id, Long userId) {
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getUserId().equals(userId)) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllReadForUser(userId);
    }
}
