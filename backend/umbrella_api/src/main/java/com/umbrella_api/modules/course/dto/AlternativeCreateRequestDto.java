package com.umbrella_api.modules.course.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AlternativeCreateRequestDto(
        @NotNull(message = "Correct flag is required") Boolean correct,

        @NotBlank(message = "Letter is required") String letter,

        @NotBlank(message = "Text is required") String text,

        @NotNull(message = "Question ID is required") Long questionId) {
}