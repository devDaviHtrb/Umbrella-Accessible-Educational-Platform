package com.umbrella_api.modules.course.service;

import java.time.Duration;
import java.time.LocalDate;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.modules.course.api.CourseService;
import com.umbrella_api.modules.course.infra.CourseProvider;

public class CourseServiceImpl implements CourseService {

    private final CourseProvider courseProvider;

    public CourseServiceImpl(CourseProvider courseProvider) {
        this.courseProvider = courseProvider;
    }

    @Override
    public GenericResponse createCourse(String name, String description, Integer difficulty_level) {

        return courseProvider.createCourse(name, description, difficulty_level);
    }

    @Override
    public GenericResponse deleteCourse(long id) {
        return courseProvider.deleteCourse(id);
    }

    @Override
    public GenericResponse createModule(String name, String description, boolean isRequired, LocalDate creationDate,
            Duration timeLimit) {
        return courseProvider.createModule(name, description, isRequired, creationDate, timeLimit);
    }

    @Override
    public GenericResponse deleteModule(long id) {
        return courseProvider.deleteModule(id);
    }

}
