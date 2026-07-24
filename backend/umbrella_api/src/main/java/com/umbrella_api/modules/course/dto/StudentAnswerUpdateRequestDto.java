package com.umbrella_api.modules.course.dto;

public record StudentAnswerUpdateRequestDto(
        Long chosenAlternativeId,
        String essayAnswer,
        Boolean isCorrect) {
}