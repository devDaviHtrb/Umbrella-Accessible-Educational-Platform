package com.umbrella_api.modules.course.api;

import java.util.List;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.course.dto.ActivityCreateRequestDto;
import com.umbrella_api.modules.course.dto.ActivityGetResponseDto;
import com.umbrella_api.modules.course.dto.ActivityUpdateRequestDto;
import com.umbrella_api.modules.course.dto.AlternativeCreateRequestDto;
import com.umbrella_api.modules.course.dto.AlternativeUpdateRequestDto;
import com.umbrella_api.modules.course.dto.CourseDto;
import com.umbrella_api.modules.course.dto.CourseGetResponseDto;
import com.umbrella_api.modules.course.dto.EssayCreateRequestDto;
import com.umbrella_api.modules.course.dto.EssayUpdateRequestDto;
import com.umbrella_api.modules.course.dto.ModuleRequestDto;
import com.umbrella_api.modules.course.dto.QuestionCreateRequestDto;
import com.umbrella_api.modules.course.dto.QuestionGetResponseDto;
import com.umbrella_api.modules.course.dto.QuestionUpdateRequestDto;
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

    // Activities CRUD
    public GenericResponse createActivity(ActivityCreateRequestDto request);

    public ActivityGetResponseDto getActivityById(Long id);

    public List<ActivityGetResponseDto> getActivitiesByModuleId(Long moduleId);

    public GenericResponse updateActivity(Long id, ActivityUpdateRequestDto request);

    public GenericResponse deleteActivity(Long id);

    // Questions CRUD
    public GenericResponse createQuestion(QuestionCreateRequestDto request);

    public QuestionGetResponseDto getQuestionById(Long id);

    public GenericResponse updateQuestion(Long id, QuestionUpdateRequestDto request);

    public GenericResponse deleteQuestion(Long id);

    // Alternatives CRUD
    public GenericResponse createAlternative(AlternativeCreateRequestDto request);

    public GenericResponse updateAlternative(Long id, AlternativeUpdateRequestDto request);

    public GenericResponse deleteAlternative(Long id);

    // Essays CRUD
    public GenericResponse createEssay(EssayCreateRequestDto request);

    public GenericResponse updateEssay(Long id, EssayUpdateRequestDto request);

    public GenericResponse deleteEssay(Long id);

}
