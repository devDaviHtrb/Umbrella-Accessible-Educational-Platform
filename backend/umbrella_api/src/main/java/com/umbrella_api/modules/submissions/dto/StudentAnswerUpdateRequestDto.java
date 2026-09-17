package com.umbrella_api.modules.submissions.dto;

public record StudentAnswerUpdateRequestDto(
        Long chosenAlternativeId,
        String essayAnswer,
        Boolean isCorrect) {
}