package com.umbrella_api.modules.schedule.dto;

import com.umbrella_api.modules.schedule.model.EventType;


import java.time.LocalDateTime;



public record EventPostRequestDto(
        String title,
        String description,
        LocalDateTime startTime,
        LocalDateTime endTime,
        EventType type,
        Long courseId,         // null if is a personal event
        Integer reminderOffset // ex: 15, 30, 60 minutes
) {

}
