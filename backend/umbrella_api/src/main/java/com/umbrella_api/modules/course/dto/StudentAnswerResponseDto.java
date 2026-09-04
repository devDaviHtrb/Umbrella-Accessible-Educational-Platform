package com.umbrella_api.modules.course.dto;

import com.umbrella_api.modules.course.model.StudentAnswers;

public record StudentAnswerResponseDto(
        Long id,
        Long submissionId,
        Long questionId,
        Long chosenAlternativeId,
        String essayAnswer,
        Boolean isCorrect) {
    public static StudentAnswerResponseDto fromEntity(StudentAnswers entity) {
        return new StudentAnswerResponseDto(
                entity.getId(),
                entity.getSubmission() != null ? entity.getSubmission().getId() : null,
                entity.getQuestion() != null ? entity.getQuestion().getId() : null,
                entity.getChosenAlternative() != null ? entity.getChosenAlternative().getId() : null,
                entity.getEssayAnswer(),
                entity.getIsCorrect());
    }
}