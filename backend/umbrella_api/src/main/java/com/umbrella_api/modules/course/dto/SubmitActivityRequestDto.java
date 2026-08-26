package com.umbrella_api.modules.course.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record SubmitActivityRequestDto(
                @NotNull(message = "Activity ID is required") Long activityId,
                @NotEmpty(message = "Answers list cannot be empty") List<StudentAnswerCorrectionDto> answers) {
}