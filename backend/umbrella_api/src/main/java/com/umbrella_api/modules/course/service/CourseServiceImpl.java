package com.umbrella_api.modules.course.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.course.api.CourseService;
import com.umbrella_api.modules.course.dto.CourseDto;
import com.umbrella_api.modules.course.dto.CourseGetResponseDto;
import com.umbrella_api.modules.course.dto.ModuleRequestDto;
import com.umbrella_api.modules.course.dto.UpdateModuleDto;
import com.umbrella_api.modules.course.infra.CourseProvider;
import com.umbrella_api.modules.course.model.Courses;
import com.umbrella_api.modules.course.model.Modules;
import com.umbrella_api.modules.course.model.Subjects;
import com.umbrella_api.modules.user.model.UserModel;

import jakarta.persistence.EntityNotFoundException;

@Service
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
    public GenericResponse createModule(ModuleRequestDto moduleData) {
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

    @Override
    public UserModel getCourseCreatorById(Long id) {
        return courseProvider.getCourseCreator(id);
    }

    @Override
    public GenericResponse createUserRelation(Long userId, Long courseId) {
        return courseProvider.createUserRelation(userId, courseId);
    }

    @Override
    public GenericResponse deleteUserRelation(Long userId, Long courseId) {
        return courseProvider.deleteUserRelation(userId, courseId);
    }

    @Override
    public GenericResponse createSubject(String subjectName) {
        return courseProvider.createSubject(subjectName);
    }

    @Override
    public List<Subjects> getSubjects() {
        return courseProvider.getSubjects();
    }

    @Override
    public GenericResponse deleteSubject(Long subjectId) {
        return courseProvider.deleteSubject(subjectId);
    }

    @Override
    public List<CourseGetResponseDto> getCoursesBySubject(Long subjectId) {
        return courseProvider.getCoursesBySubject(subjectId);
    }

}
