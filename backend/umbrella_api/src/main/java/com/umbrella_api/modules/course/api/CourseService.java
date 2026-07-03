package com.umbrella_api.modules.course.api;

import java.util.List;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.modules.course.dto.CourseDto;
import com.umbrella_api.modules.course.dto.ModuleDto;
import com.umbrella_api.modules.course.dto.UpdateModuleDto;
import com.umbrella_api.modules.course.model.Courses;
import com.umbrella_api.modules.course.model.Modules;

public interface CourseService {
    public GenericResponse createCourse(CourseDto courseData);

    public Courses getCourseById(Long id);

    public GenericResponse updateCourse(Long id, CourseDto courseData);

    public GenericResponse deleteCourse(long id);

    public GenericResponse createModule(ModuleDto moduleData); // awaiting the data dict for define the type of
                                                               // "timeLimit"

    public GenericResponse deleteModule(long id);

    public GenericResponse updateModule(Long id, UpdateModuleDto moduleData);

    public List<Modules> getModulesByCourse(Long courseId);

    public Modules getModuleById(Long moduleId);

}
