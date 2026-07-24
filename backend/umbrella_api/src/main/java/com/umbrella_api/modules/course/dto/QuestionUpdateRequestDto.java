package com.umbrella_api.modules.course.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record QuestionUpdateRequestDto(
        @PositiveOrZero(message = "Value must be zero or positive") Float value,

        String status,

        @Positive(message = "Question number must be positive") Integer number,

        String statement) {
}