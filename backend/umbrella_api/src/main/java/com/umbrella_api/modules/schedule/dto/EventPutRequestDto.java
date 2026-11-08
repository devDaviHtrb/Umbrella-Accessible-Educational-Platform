package com.umbrella_api.modules.schedule.dto;

import com.umbrella_api.modules.schedule.model.EventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record EventPutRequestDto(
        @NotBlank(message = "The tittle is necessary")
        String title,

        String description,

        @NotNull(message = "The start time is necessary")
        LocalDateTime startTime,

        @NotNull(message = "The end time is necessary")
        LocalDateTime endTime,

        @NotNull(message = "The event type is necessary")
        EventType type
) {
}