package com.umbrella_api.modules.course.dto;

import com.umbrella_api.modules.course.model.Courses;
import java.util.List;
import java.util.stream.Collectors;

public record CourseGetResponseDto(
        Long id,
        String name,
        String description,
        Integer difficultyLevel,
        int moduleAmount,
        Long subjectId,
        String subjectName) {

    public static CourseGetResponseDto fromEntity(Courses course) {
        if (course == null)
            return null;

        Long sId = (course.getSubject() != null) ? course.getSubject().getId() : null;
        String sName = (course.getSubject() != null) ? course.getSubject().getSubject() : null;

        return new CourseGetResponseDto(
                course.getId(),
                course.getName(),
                course.getDescription(),
                course.getDifficulty_level(),
                course.getModule_amount(),
                sId,
                sName);
    }

    public static List<CourseGetResponseDto> fromEntityList(List<Courses> courses) {
        if (courses == null || courses.isEmpty()) {
            return List.of();
        }
        return courses.stream()
                .map(CourseGetResponseDto::fromEntity)
                .collect(Collectors.toList());
    }
}