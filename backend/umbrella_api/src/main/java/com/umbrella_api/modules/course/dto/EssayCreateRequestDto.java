package com.umbrella_api.modules.course.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record EssayCreateRequestDto(
                @NotBlank(message = "Expected answer is required") String expectedAnswer,

                @Positive(message = "Min letters must be positive") Integer minLetters,

                @Positive(message = "Max letters must be positive") Integer maxLetters,

                @NotNull(message = "Question ID is required") Long questionId) {
}