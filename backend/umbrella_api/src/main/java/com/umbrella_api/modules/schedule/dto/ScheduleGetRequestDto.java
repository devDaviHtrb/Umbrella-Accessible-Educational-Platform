package com.umbrella_api.modules.schedule.dto;

import com.umbrella_api.modules.schedule.model.EventStatus;
import com.umbrella_api.modules.schedule.model.EventType;
import com.umbrella_api.modules.schedule.model.Events;
import com.umbrella_api.modules.schedule.model.UserEvents;

import java.time.LocalDateTime;

public record ScheduleGetRequestDto(
        Long id,
        String title,
        String description,
        LocalDateTime startTime,
        LocalDateTime endTime,
        EventType type,
        Long courseId,
        EventStatus status,
        Integer reminderOffset  
) {
    public static ScheduleGetRequestDto fromEntity(Events event, UserEvents userEvent) {
        Long courseId = (event.getCourse() != null)
                ? event.getCourse().getId()
                : null;

        EventStatus status = (userEvent != null && userEvent.getStatus() != null)
                ? userEvent.getStatus()
                : EventStatus.PENDING;

        Integer reminderOffset = (userEvent != null)
                ? userEvent.getReminderOffset()
                : null;

        return new ScheduleGetRequestDto(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getStartTime(),
                event.getEndTime(),
                event.getType(),
                courseId,
                status,
                reminderOffset
        );
    }


    public static ScheduleGetRequestDto fromEntity(Events event) {
        return fromEntity(event, null);
    }
}
