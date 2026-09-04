package com.umbrella_api.modules.course.dto;

import com.umbrella_api.modules.course.model.Alternatives;
import java.util.List;
import java.util.stream.Collectors;

public record AlternativeGetResponseDto(
        Long id,
        boolean correct,
        String letter,
        String text,
        Long questionId) {

    public static AlternativeGetResponseDto fromEntity(Alternatives alternative) {
        if (alternative == null) {
            return null;
        }

        Long qId = (alternative.getQuestion() != null) ? alternative.getQuestion().getId() : null;

        return new AlternativeGetResponseDto(
                alternative.getId(),
                alternative.isCorrect(),
                alternative.getLetter(),
                alternative.getText(),
                qId);
    }

    public static List<AlternativeGetResponseDto> fromEntityList(List<Alternatives> alternatives) {
        if (alternatives == null || alternatives.isEmpty()) {
            return List.of();
        }
        return alternatives.stream()
                .map(AlternativeGetResponseDto::fromEntity)
                .collect(Collectors.toList());
    }
}