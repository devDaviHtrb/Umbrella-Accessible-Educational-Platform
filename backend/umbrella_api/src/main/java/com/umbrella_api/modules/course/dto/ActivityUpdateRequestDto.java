package com.umbrella_api.modules.course.dto;

import jakarta.validation.constraints.PositiveOrZero;

public record ActivityUpdateRequestDto(
        String title,
        Boolean test,

        @PositiveOrZero(message = "Max score must be zero or positive") Float maxScore,

        String status,
        Long moduleId) {
}