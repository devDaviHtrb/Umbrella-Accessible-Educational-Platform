package com.umbrella_api.modules.course.dto;

import jakarta.validation.constraints.NotNull;

public record StudentAnswerCorrectionDto(
        @NotNull(message = "Question ID is required") Long questionId,
        Long chosenAlternativeId,
        String essayAnswer) {
}
