package com.umbrella_api.modules.course.dto;

import jakarta.validation.constraints.NotNull;

public record ActivitySubmissionCreateRequestDto(
                @NotNull(message = "Activity ID is required") Long activityId) {
}