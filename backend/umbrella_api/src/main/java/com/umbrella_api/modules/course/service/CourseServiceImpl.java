package com.umbrella_api.modules.course.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.course.api.CourseService;
import com.umbrella_api.modules.course.dto.ActivityCreateRequestDto;
import com.umbrella_api.modules.course.dto.ActivityGetResponseDto;
import com.umbrella_api.modules.course.dto.ActivitySubmissionCreateRequestDto;
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
import com.umbrella_api.modules.course.dto.StudentAnswerCreateRequestDto;
import com.umbrella_api.modules.course.dto.StudentAnswerResponseDto;
import com.umbrella_api.modules.course.dto.StudentAnswerUpdateRequestDto;
import com.umbrella_api.modules.course.dto.SubmitActivityRequestDto;
import com.umbrella_api.modules.course.dto.UpdateModuleDto;
import com.umbrella_api.modules.course.infra.CourseProvider;
import com.umbrella_api.modules.course.model.Activities;
import com.umbrella_api.modules.course.model.Alternatives;
import com.umbrella_api.modules.course.model.Courses;
import com.umbrella_api.modules.course.model.Essays;
import com.umbrella_api.modules.course.model.Modules;
import com.umbrella_api.modules.course.model.Questions;
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
    public Courses createCourse(CourseDto courseData, CustomUserDetails loggedUser) {

        return courseProvider.createCourse(courseData, loggedUser);
    }

    @Override
    public GenericResponse deleteCourse(long id) {
        return courseProvider.deleteCourse(id);
    }

    @Override
    public Modules createModule(ModuleRequestDto moduleData) {
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
    public Modules updateModule(Long id, UpdateModuleDto moduleData) {
        return courseProvider.updateModule(id, moduleData);
    }

    @Override
    public Courses updateCourse(Long id, CourseDto courseData) {
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
    public List<Courses> getEnrolledCoursesByUser(CustomUserDetails userDetails){
        return courseProvider.getEnrolledCoursesByUser(userDetails);
    }

    @Override
    public GenericResponse deleteUserRelation(Long userId, Long courseId) {
        return courseProvider.deleteUserRelation(userId, courseId);
    }

    @Override
    public Subjects createSubject(String subjectName) {
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

    // ==========================================
    // ACTIVITIES CRUD
    // ==========================================

    @Override
    public Activities createActivity(ActivityCreateRequestDto request) {
        return courseProvider.createActivity(request);
    }

    @Override
    public ActivityGetResponseDto getActivityById(Long id) {
        ActivityGetResponseDto dto = courseProvider.getActivityById(id);
        if (dto == null) {
            throw new EntityNotFoundException("Activity not found");
        }
        return dto;
    }

    @Override
    public List<ActivityGetResponseDto> getActivitiesByModuleId(Long moduleId) {
        return courseProvider.getActivitiesByModuleId(moduleId);
    }

    @Override
    public Activities updateActivity(Long id, ActivityUpdateRequestDto request) {
        return courseProvider.updateActivity(id, request);
    }

    @Override
    public GenericResponse deleteActivity(Long id) {
        return courseProvider.deleteActivity(id);
    }

    // ==========================================
    // QUESTIONS CRUD
    // ==========================================

    @Override
    public Questions createQuestion(QuestionCreateRequestDto request) {
        return courseProvider.createQuestion(request);
    }

    @Override
    public QuestionGetResponseDto getQuestionById(Long id) {
        QuestionGetResponseDto dto = courseProvider.getQuestionById(id);
        if (dto == null) {
            throw new EntityNotFoundException("Question not found");
        }
        return dto;
    }

    @Override
    public Questions updateQuestion(Long id, QuestionUpdateRequestDto request) {
        return courseProvider.updateQuestion(id, request);
    }

    @Override
    public GenericResponse deleteQuestion(Long id) {
        return courseProvider.deleteQuestion(id);
    }

    // ==========================================
    // ALTERNATIVES CRUD
    // ==========================================

    @Override
    public Alternatives createAlternative(AlternativeCreateRequestDto request) {
        return courseProvider.createAlternative(request);
    }

    @Override
    public Alternatives updateAlternative(Long id, AlternativeUpdateRequestDto request) {
        return courseProvider.updateAlternative(id, request);
    }

    @Override
    public GenericResponse deleteAlternative(Long id) {
        return courseProvider.deleteAlternative(id);
    }

    // ==========================================
    // ESSAYS CRUD
    // ==========================================

    @Override
    public Essays createEssay(EssayCreateRequestDto request) {
        return courseProvider.createEssay(request);
    }

    @Override
    public Essays updateEssay(Long id, EssayUpdateRequestDto request) {
        return courseProvider.updateEssay(id, request);
    }

    @Override
    public GenericResponse deleteEssay(Long id) {
        return courseProvider.deleteEssay(id);
    }

    // ==========================================
    // ACTIVITY SUBMISSIONS CRUD
    // ==========================================

    @Override
    public ActivitySubmissionResponseDto getActivitySubmissionById(Long id) {
        ActivitySubmissionResponseDto dto = courseProvider.getActivitySubmissionById(id);
        if (dto == null) {
            throw new EntityNotFoundException("Activity submission not found");
        }
        return dto;
    }

    @Override
    public List<ActivitySubmissionResponseDto> getSubmissionsByActivityId(Long activityId) {
        return courseProvider.getSubmissionsByActivityId(activityId);
    }

    @Override
    public List<ActivitySubmissionResponseDto> getSubmissionsByUserId(Long userId) {
        return courseProvider.getSubmissionsByUserId(userId);
    }

    @Override
    public GenericResponse updateActivitySubmission(Long id, ActivitySubmissionUpdateRequestDto request) {
        return courseProvider.updateActivitySubmission(id, request);
    }

    @Override
    public GenericResponse deleteActivitySubmission(Long id) {
        return courseProvider.deleteActivitySubmission(id);
    }

    // ==========================================
    // STUDENT ANSWERS CRUD
    // ==========================================

    @Override
    public StudentAnswerResponseDto getStudentAnswerById(Long id) {
        StudentAnswerResponseDto dto = courseProvider.getStudentAnswerById(id);
        if (dto == null) {
            throw new EntityNotFoundException("Student answer not found");
        }
        return dto;
    }

    @Override
    public List<StudentAnswerResponseDto> getAnswersBySubmissionId(Long submissionId) {
        return courseProvider.getAnswersBySubmissionId(submissionId);
    }

    @Override
    public StudentAnswerResponseDto updateStudentAnswer(Long id, StudentAnswerUpdateRequestDto request) {
        return courseProvider.updateStudentAnswer(id, request);
    }

    @Override
    public GenericResponse deleteStudentAnswer(Long id) {
        return courseProvider.deleteStudentAnswer(id);
    }

    @Override
    public ActivitySubmissionResponseDto correctSubmission(SubmitActivityRequestDto request, CustomUserDetails user) {
        return courseProvider.correctSubmission(request, user);
    }

}
