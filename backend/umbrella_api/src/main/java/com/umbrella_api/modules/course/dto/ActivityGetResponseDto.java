package com.umbrella_api.modules.course.dto;

import com.umbrella_api.modules.course.model.Activities;
import java.util.List;
import java.util.stream.Collectors;

public record ActivityGetResponseDto(
        Long id,
        String title,
        boolean test,
        Float maxScore,
        String status,
        Long moduleId,
        List<QuestionGetResponseDto> questions) {

    public static ActivityGetResponseDto fromEntity(Activities activity) {
        if (activity == null) {
            return null;
        }

        Long modId = (activity.getModule() != null) ? activity.getModule().getId() : null;

        return new ActivityGetResponseDto(
                activity.getId(),
                activity.getTitle(),
                activity.isTest(),
                activity.getMaxScore(),
                activity.getStatus(),
                modId,
                QuestionGetResponseDto.fromEntityList(activity.getQuestions()));
    }

    public static List<ActivityGetResponseDto> fromEntityList(List<Activities> activities) {
        if (activities == null || activities.isEmpty()) {
            return List.of();
        }
        return activities.stream()
                .map(ActivityGetResponseDto::fromEntity)
                .collect(Collectors.toList());
    }
}