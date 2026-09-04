package com.umbrella_api.modules.course.dto;

import com.umbrella_api.modules.course.model.Courses;
import com.umbrella_api.modules.user.dto.UserResponseDto;
import com.umbrella_api.modules.user.model.UserModel;

public record CourseResponseDto(Long id, String name, String description, int module_amount, int difficulty_level,
        SubjectsResponseDto subject,
        UserResponseDto userDto) {

    public static CourseResponseDto fromEntity(Courses course, UserModel creator) {

        return new CourseResponseDto(
                course.getId(),
                course.getName(),
                course.getDescription(),
                course.getModule_amount(),
                course.getDifficulty_level(),
                SubjectsResponseDto.fromEntity((course.getSubject())),
                UserResponseDto.fromEntity(creator));
    }

}
