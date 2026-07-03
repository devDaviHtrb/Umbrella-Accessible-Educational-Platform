package com.umbrella_api.modules.course.api;

import java.time.Duration;

import java.time.LocalDate;

import com.umbrella_api.common.dto.GenericResponse;

public interface CourseService {
    public GenericResponse createCourse(String name, String description, Integer difficulty_level);

    public GenericResponse deleteCourse(long id);

    public GenericResponse createModule(String name, String description, boolean isRequired, LocalDate creationDate,
            Duration timeLimit); // awaiting the data dict for define the type of "timeLimit"

    public GenericResponse deleteModule(long id);

}
