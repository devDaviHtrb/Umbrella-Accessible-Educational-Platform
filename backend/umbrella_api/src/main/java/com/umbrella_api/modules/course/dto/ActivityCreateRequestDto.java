package com.umbrella_api.modules.course.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record ActivityCreateRequestDto(
        @NotBlank(message = "Title is required") String title,

        @NotNull(message = "Test flag is required") Boolean test,

        @NotNull(message = "Max score is required") @PositiveOrZero(message = "Max score must be zero or positive") Float maxScore,

        String status,

        @NotNull(message = "Module ID is required") Long moduleId) {
}