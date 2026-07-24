package com.umbrella_api.modules.course.dto;

import jakarta.validation.constraints.PositiveOrZero;

public record ActivitySubmissionUpdateRequestDto(
                @PositiveOrZero(message = "Score must be zero or positive") Float score,

                String status) {
}