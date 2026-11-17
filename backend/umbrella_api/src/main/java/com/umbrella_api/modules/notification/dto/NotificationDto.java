package com.umbrella_api.modules.notification.dto;

import java.util.List;

import com.umbrella_api.modules.notification.model.Notification;

/** Notificação exposta ao app. */
public record NotificationDto(
        Long id,
        String type,
        String title,
        String body,
        Long courseId,
        Long referenceId,
        boolean read,
        String createdAt) {

    public static NotificationDto fromEntity(Notification n) {
        if (n == null) {
            return null;
        }
        return new NotificationDto(
                n.getId(),
                n.getType() != null ? n.getType().name() : null,
                n.getTitle(),
                n.getBody(),
                n.getCourseId(),
                n.getReferenceId(),
                n.isRead(),
                n.getCreatedAt() != null ? n.getCreatedAt().toString() : null);
    }

    public static List<NotificationDto> fromList(List<Notification> list) {
        if (list == null) {
            return List.of();
        }
        return list.stream().map(NotificationDto::fromEntity).toList();
    }
}
