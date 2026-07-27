package com.umbrella_api.modules.course.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record QuestionCreateRequestDto(
                @NotNull(message = "Value is required") @PositiveOrZero(message = "Value must be zero or positive") Float points,

                String status,

                @NotNull(message = "Question number is required") @Positive(message = "Question number must be positive") Integer number,

                @NotBlank(message = "Statement is required") String statement,

                @NotNull(message = "Activity ID is required") Long activityId) {
}