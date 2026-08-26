package com.umbrella_api.modules.course.api;

import java.util.List;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.course.dto.ActivityCreateRequestDto;
import com.umbrella_api.modules.course.dto.ActivityGetResponseDto;
import com.umbrella_api.modules.course.dto.ActivitySubmissionResponseDto;
import com.umbrella_api.modules.course.dto.ActivitySubmissionUpdateRequestDto;
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
import com.umbrella_api.modules.course.dto.StudentAnswerResponseDto;
import com.umbrella_api.modules.course.dto.StudentAnswerUpdateRequestDto;
import com.umbrella_api.modules.course.dto.SubmitActivityRequestDto;
import com.umbrella_api.modules.course.dto.UpdateModuleDto;
import com.umbrella_api.modules.course.model.Activities;
import com.umbrella_api.modules.course.model.Alternatives;
import com.umbrella_api.modules.course.model.Courses;
import com.umbrella_api.modules.course.model.Essays;
import com.umbrella_api.modules.course.model.Modules;
import com.umbrella_api.modules.course.model.Questions;
import com.umbrella_api.modules.course.model.Subjects;
import com.umbrella_api.modules.user.model.UserModel;

public interface CourseService {

    // Course crud
    public Courses createCourse(CourseDto courseData, CustomUserDetails loggedUser);

    public Courses getCourseById(Long id);

    public Courses updateCourse(Long id, CourseDto courseData);

    public GenericResponse deleteCourse(long id);

    // Module crud
    public Modules createModule(ModuleRequestDto moduleData); // awaiting the data dict for define the type of
                                                              // "timeLimit"

    public GenericResponse deleteModule(long id);

    public Modules updateModule(Long id, UpdateModuleDto moduleData);

    public List<Modules> getModulesByCourse(Long courseId);

    public Modules getModuleById(Long moduleId);

    public UserModel getCourseCreatorById(Long Id);

    // Course/user relation crud
    public GenericResponse createUserRelation(Long userId, Long courseId);

    public GenericResponse deleteUserRelation(Long userId, Long courseId);

    public List<Courses> getEnrolledCoursesByUser(CustomUserDetails userDetails);

    // Subject crud
    public Subjects createSubject(String subjectName);

    public List<Subjects> getSubjects();

    public GenericResponse deleteSubject(Long subjectId);

    public List<CourseGetResponseDto> getCoursesBySubject(Long subjectId);

    // Activities CRUD
    public Activities createActivity(ActivityCreateRequestDto request);

    public ActivityGetResponseDto getActivityById(Long id);

    public List<ActivityGetResponseDto> getActivitiesByModuleId(Long moduleId);

    public Activities updateActivity(Long id, ActivityUpdateRequestDto request);

    public GenericResponse deleteActivity(Long id);

    // Questions CRUD
    public Questions createQuestion(QuestionCreateRequestDto request);

    public QuestionGetResponseDto getQuestionById(Long id);

    public Questions updateQuestion(Long id, QuestionUpdateRequestDto request);

    public GenericResponse deleteQuestion(Long id);

    // Alternatives CRUD
    public Alternatives createAlternative(AlternativeCreateRequestDto request);

    public Alternatives updateAlternative(Long id, AlternativeUpdateRequestDto request);

    public GenericResponse deleteAlternative(Long id);

    // Essays CRUD
    public Essays createEssay(EssayCreateRequestDto request);

    public Essays updateEssay(Long id, EssayUpdateRequestDto request);

    public GenericResponse deleteEssay(Long id);

    // ACTIVITY SUBMISSIONS CRUD

    public ActivitySubmissionResponseDto getActivitySubmissionById(Long id);

    public List<ActivitySubmissionResponseDto> getSubmissionsByActivityId(Long activityId);

    public List<ActivitySubmissionResponseDto> getSubmissionsByUserId(Long userId);

    public GenericResponse updateActivitySubmission(Long id, ActivitySubmissionUpdateRequestDto request);

    public GenericResponse deleteActivitySubmission(Long id);

    // STUDENT ANSWERS CRUD

    public StudentAnswerResponseDto getStudentAnswerById(Long id);

    public List<StudentAnswerResponseDto> getAnswersBySubmissionId(Long submissionId);

    public StudentAnswerResponseDto updateStudentAnswer(Long id, StudentAnswerUpdateRequestDto request);

    public GenericResponse deleteStudentAnswer(Long id);

    public ActivitySubmissionResponseDto correctSubmission(SubmitActivityRequestDto request, CustomUserDetails user);

}
