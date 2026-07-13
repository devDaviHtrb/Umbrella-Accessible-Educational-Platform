package com.umbrella_api.modules.course.api;

import java.util.List;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.course.dto.CourseDto;
import com.umbrella_api.modules.course.dto.CourseGetResponseDto;
import com.umbrella_api.modules.course.dto.ModuleRequestDto;
import com.umbrella_api.modules.course.dto.UpdateModuleDto;
import com.umbrella_api.modules.course.model.Courses;
import com.umbrella_api.modules.course.model.Modules;
import com.umbrella_api.modules.course.model.Subjects;
import com.umbrella_api.modules.user.model.UserModel;

public interface CourseService {

    // Course crud
    public GenericResponse createCourse(CourseDto courseData, CustomUserDetails loggedUser);

    public Courses getCourseById(Long id);

    public GenericResponse updateCourse(Long id, CourseDto courseData);

    public GenericResponse deleteCourse(long id);

    // Module crud
    public GenericResponse createModule(ModuleRequestDto moduleData); // awaiting the data dict for define the type of
                                                                      // "timeLimit"

    public GenericResponse deleteModule(long id);

    public GenericResponse updateModule(Long id, UpdateModuleDto moduleData);

    public List<Modules> getModulesByCourse(Long courseId);

    public Modules getModuleById(Long moduleId);

    public UserModel getCourseCreatorById(Long Id);

    // Course/user relation crud
    public GenericResponse createUserRelation(Long userId, Long courseId);

    public GenericResponse deleteUserRelation(Long userId, Long courseId);

    // Subject crud
    public GenericResponse createSubject(String subjectName);

    public List<Subjects> getSubjects();

    public GenericResponse deleteSubject(Long subjectId);

    public List<CourseGetResponseDto> getCoursesBySubject(Long subjectId);

    // Activities crud

    // Questions crud

}
