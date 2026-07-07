package com.umbrella_api.modules.course.service;

import java.util.List;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.course.api.CourseService;
import com.umbrella_api.modules.course.dto.CourseDto;
import com.umbrella_api.modules.course.dto.ModuleDto;
import com.umbrella_api.modules.course.dto.UpdateModuleDto;
import com.umbrella_api.modules.course.infra.CourseProvider;
import com.umbrella_api.modules.course.model.Courses;
import com.umbrella_api.modules.course.model.Modules;

import jakarta.persistence.EntityNotFoundException;

public class CourseServiceImpl implements CourseService {

    private final CourseProvider courseProvider;

    public CourseServiceImpl(CourseProvider courseProvider) {
        this.courseProvider = courseProvider;
    }

    @Override
    public GenericResponse createCourse(CourseDto courseData, CustomUserDetails loggedUser) {

        return courseProvider.createCourse(courseData, loggedUser);
    }

    @Override
    public GenericResponse deleteCourse(long id) {
        return courseProvider.deleteCourse(id);
    }

    @Override
    public GenericResponse createModule(ModuleDto moduleData) {
        return courseProvider.createModule(moduleData);
    }

    @Override
    public GenericResponse deleteModule(long id) {
        return courseProvider.deleteModule(id);
    }

    @Override
    public List<Modules> getModulesByCourse(Long courseId) {
        return courseProvider.getModulesByCourse(courseId);
    }

    @Override
    public Modules getModuleById(Long moduleId) {
        return courseProvider.getModuleById(moduleId)
                .orElseThrow(() -> new EntityNotFoundException("Module not found"));
    }

    @Override
    public GenericResponse updateModule(Long id, UpdateModuleDto moduleData) {
        return courseProvider.updateModule(id, moduleData);
    }

    @Override
    public GenericResponse updateCourse(Long id, CourseDto courseData) {
        return courseProvider.updateCourse(id, courseData);
    }

    @Override
    public Courses getCourseById(Long id) {
        return courseProvider.getCourseById(id)
                .orElseThrow(() -> new EntityNotFoundException("Course not found"));
    }

}
