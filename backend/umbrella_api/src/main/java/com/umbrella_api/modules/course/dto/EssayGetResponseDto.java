package com.umbrella_api.modules.course.dto;

import com.umbrella_api.modules.course.model.Essays;

public record EssayGetResponseDto(
        Long id,
        String expectedAnswer,
        Integer minLines,
        Integer maxLines,
        Long questionId) {

    public static EssayGetResponseDto fromEntity(Essays essay) {
        if (essay == null) {
            return null;
        }

        Long qId = (essay.getQuestion() != null) ? essay.getQuestion().getId() : null;

        return new EssayGetResponseDto(
                essay.getId(),
                essay.getExpectedAnswer(),
                essay.getMinLetters(),
                essay.getMaxLetters(),
                qId);
    }
}