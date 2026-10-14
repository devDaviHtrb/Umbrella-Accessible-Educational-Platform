package com.umbrella_api.modules.course.dto;

import java.util.List;
import java.util.stream.Collectors;

import com.umbrella_api.modules.course.model.Subjects;

public record SubjectsResponseDto(Long id, String name) {
    public static SubjectsResponseDto fromEntity(Subjects subject) {
        return new SubjectsResponseDto(subject.getId(), subject.getSubject());
    }

    public static List<SubjectsResponseDto> fromEntityList(List<Subjects> subjects) {
        if (subjects == null || subjects.isEmpty()) {
            return List.of();
        }
        return subjects.stream()
                .map(SubjectsResponseDto::fromEntity)
                .collect(Collectors.toList());
    }
}
