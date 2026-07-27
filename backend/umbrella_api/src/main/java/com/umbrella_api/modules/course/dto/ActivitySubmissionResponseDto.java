package com.umbrella_api.modules.course.dto;

import java.time.LocalDateTime;
import java.util.List;
import com.umbrella_api.modules.course.model.ActivitySubmissions;

public record ActivitySubmissionResponseDto(
        Long id,
        Float score,
        String status,
        LocalDateTime submittedAt,
        Long userId,
        Long activityId,
        List<StudentAnswerResponseDto> answers) {
    public static ActivitySubmissionResponseDto fromEntity(ActivitySubmissions entity) {
        return new ActivitySubmissionResponseDto(
                entity.getId(),
                entity.getScore(),
                entity.getStatus(),
                entity.getSubmittedAt(),
                entity.getUser() != null ? entity.getUser().getId() : null,
                entity.getActivity() != null ? entity.getActivity().getId() : null,
                entity.getAnswers() != null
                        ? entity.getAnswers().stream().map(StudentAnswerResponseDto::fromEntity).toList()
                        : List.of());
    }

    public static List<ActivitySubmissionResponseDto> fromEntityList(List<ActivitySubmissions> entities) {
        if (entities == null)
            return List.of();
        return entities.stream()
                .map(ActivitySubmissionResponseDto::fromEntity)
                .toList();
    }
}