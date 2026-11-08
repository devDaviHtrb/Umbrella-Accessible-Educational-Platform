package com.umbrella_api.modules.course.dto;

import com.umbrella_api.modules.course.model.Courses;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public record CourseGetResponseDto(
        Long id,
        String name,
        String description,
        Integer difficultyLevel,
        int moduleAmount,
        Long subjectId,
        String subjectName,
        String imageUrl,
        Long studentsCount) {

    public static CourseGetResponseDto fromEntity(Courses course) {
        return fromEntity(course, null);
    }

    public static CourseGetResponseDto fromEntity(Courses course, Long studentsCount) {
        if (course == null)
            return null;

        Long sId = (course.getSubject() != null) ? course.getSubject().getId() : null;
        String sName = (course.getSubject() != null) ? course.getSubject().getSubject() : null;
        String imgUrl = (course.getImage() != null) ? course.getImage().getUrl() : null;

        return new CourseGetResponseDto(
                course.getId(),
                course.getName(),
                course.getDescription(),
                course.getDifficulty_level(),
                course.getModule_amount(),
                sId,
                sName,
                imgUrl,
                studentsCount != null ? studentsCount : 0L);
    }

    public static List<CourseGetResponseDto> fromEntityList(List<Courses> courses) {
        return fromEntityList(courses, Map.of());
    }

    public static List<CourseGetResponseDto> fromEntityList(List<Courses> courses, Map<Long, Long> studentsByCourse) {
        if (courses == null || courses.isEmpty()) {
            return List.of();
        }
        return courses.stream()
                .map(course -> fromEntity(course, studentsByCourse.getOrDefault(course.getId(), 0L)))
                .collect(Collectors.toList());
    }
}
