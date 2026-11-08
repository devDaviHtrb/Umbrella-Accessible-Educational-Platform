package com.umbrella_api.modules.activity.dto;

import jakarta.validation.constraints.Positive;

public record EssayUpdateRequestDto(
                String expectedAnswer,

                @Positive(message = "Min letters must be positive") Integer minLetters,

                @Positive(message = "Max letters must be positive") Integer maxLetters) {
}