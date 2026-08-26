package com.umbrella_api.modules.course.dto;

import com.umbrella_api.modules.course.model.Questions;
import java.util.List;
import java.util.stream.Collectors;

public record QuestionGetResponseDto(
        Long id,
        Float points,
        String status,
        Integer number,
        String statement,
        Long activityId,
        EssayGetResponseDto essay,
        List<AlternativeGetResponseDto> alternatives) {

    public static QuestionGetResponseDto fromEntity(Questions question) {
        if (question == null) {
            return null;
        }

        Long actId = (question.getActivity() != null) ? question.getActivity().getId() : null;

        return new QuestionGetResponseDto(
                question.getId(),
                question.getPoints(),
                question.getStatus(),
                question.getNumber(),
                question.getStatement(),
                actId,
                EssayGetResponseDto.fromEntity(question.getEssay()),
                AlternativeGetResponseDto.fromEntityList(question.getAlternatives()));
    }

    public static List<QuestionGetResponseDto> fromEntityList(List<Questions> questions) {
        if (questions == null || questions.isEmpty()) {
            return List.of();
        }
        return questions.stream()
                .map(QuestionGetResponseDto::fromEntity)
                .collect(Collectors.toList());
    }
}
