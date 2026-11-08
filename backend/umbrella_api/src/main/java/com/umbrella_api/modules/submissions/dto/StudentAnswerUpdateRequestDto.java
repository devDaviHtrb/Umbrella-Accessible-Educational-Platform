package com.umbrella_api.modules.submissions.dto;

import jakarta.validation.constraints.PositiveOrZero;

public record StudentAnswerUpdateRequestDto(
        Long chosenAlternativeId,
        String essayAnswer,
        Boolean isCorrect,
        @PositiveOrZero(message = "Score must be zero or positive") Float score) {
}
