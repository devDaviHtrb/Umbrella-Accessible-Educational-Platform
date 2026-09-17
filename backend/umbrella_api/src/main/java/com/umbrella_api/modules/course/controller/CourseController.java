package com.umbrella_api.modules.course.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.course.api.CourseService;
import com.umbrella_api.modules.course.dto.*;
import com.umbrella_api.modules.course.model.*;
import com.umbrella_api.modules.user.model.UserModel;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/public/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    // ==========================================
    // COURSES
    // ==========================================

    @PostMapping("/register")
    public ResponseEntity<Courses> registerCourse(
            @RequestBody @Valid CourseDto courseData,
            @AuthenticationPrincipal CustomUserDetails loggedUser) {
        return ResponseEntity.ok(courseService.createCourse(courseData, loggedUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseResponseDto> getCourseById(@PathVariable Long id) {
        Courses course = courseService.getCourseById(id);
        UserModel creator = courseService.getCourseCreatorById(id);
        return ResponseEntity.ok(CourseResponseDto.fromEntity(course, creator));
    }

    @PreAuthorize("@securityEvaluator.isCourseOwner(#id, principal)")
    @DeleteMapping("/{id}")
    public ResponseEntity<GenericResponse> deleteCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteCourse(id));
    }

    // ==========================================
    // MODULES
    // ==========================================

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @PostMapping("/{courseId}/add_module")
    public ResponseEntity<Modules> addModule(
            @PathVariable Long courseId,
            @RequestBody @Valid ModuleRequestDto moduleData) {
        return ResponseEntity.ok(courseService.createModule(moduleData));
    }

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @PutMapping("/{courseId}/modules/{id}")
    public ResponseEntity<Modules> updateModule(
            @PathVariable Long courseId,
            @PathVariable Long id,
            @RequestBody @Valid UpdateModuleDto moduleData) {
        return ResponseEntity.ok(courseService.updateModule(id, moduleData));
    }

    @GetMapping("/{id}/modules")
    public ResponseEntity<List<ModulesResponseDto>> getModulesByCourse(@PathVariable Long id) {
        List<Modules> modules = courseService.getModulesByCourse(id);
        return ResponseEntity.ok(ModulesResponseDto.fromEntityList(modules));
    }

    @GetMapping("/modules/{id}")
    public ResponseEntity<ModulesResponseDto> getModuleById(@PathVariable Long id) {
        Modules module = courseService.getModuleById(id);
        return ResponseEntity.ok(ModulesResponseDto.fromEntity(module));
    }

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @DeleteMapping("/{courseId}/modules/{id}")
    public ResponseEntity<GenericResponse> deleteModule(
            @PathVariable Long courseId,
            @PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteModule(id));
    }

    // ==========================================
    // ENROLLMENTS & SUBJECTS
    // ==========================================

    @PostMapping("/{id}/enrrolment/{userId}")
    public ResponseEntity<GenericResponse> createUserRelation(@PathVariable Long id, @PathVariable Long userId) {
        return ResponseEntity.ok(courseService.createUserRelation(userId, id));
    }

    @DeleteMapping("/{id}/enrrolment/{userId}")
    public ResponseEntity<GenericResponse> deleteUserRelation(@PathVariable Long id, @PathVariable Long userId) {
        return ResponseEntity.ok(courseService.deleteUserRelation(userId, id));
    }

    @PostMapping("/subjects/register")
    public ResponseEntity<Subjects> newSubject(@RequestBody String name) {
        return ResponseEntity.ok(courseService.createSubject(name));
    }

    @GetMapping("/subjects")
    public ResponseEntity<List<SubjectsResponseDto>> getSubjects() {
        return ResponseEntity.ok(SubjectsResponseDto.fromEntityList(courseService.getSubjects()));
    }

    @DeleteMapping("/subjects/{id}")
    public ResponseEntity<GenericResponse> deleteSubject(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteSubject(id));
    }

    @GetMapping("/bySubject/{id}")
    public ResponseEntity<List<CourseGetResponseDto>> gerCoursesBySubject(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCoursesBySubject(id));
    }

    // ==========================================
    // ACTIVITIES
    // ==========================================

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @PostMapping("/{courseId}/modules/{moduleId}/activities")
    public ResponseEntity<Activities> createActivity(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @RequestBody @Valid ActivityCreateRequestDto request) {
        return ResponseEntity.ok(courseService.createActivity(request));
    }

    @GetMapping("/activities/{id}")
    public ResponseEntity<ActivityGetResponseDto> getActivityById(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getActivityById(id));
    }

    @GetMapping("/modules/{moduleId}/activities")
    public ResponseEntity<List<ActivityGetResponseDto>> getActivitiesByModuleId(@PathVariable Long moduleId) {
        return ResponseEntity.ok(courseService.getActivitiesByModuleId(moduleId));
    }

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @PutMapping("/{courseId}/modules/{moduleId}/activities/{id}")
    public ResponseEntity<Activities> updateActivity(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long id,
            @RequestBody @Valid ActivityUpdateRequestDto request) {
        return ResponseEntity.ok(courseService.updateActivity(id, request));
    }

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @DeleteMapping("/{courseId}/modules/{moduleId}/activities/{id}")
    public ResponseEntity<GenericResponse> deleteActivity(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteActivity(id));
    }

    // ==========================================
    // QUESTIONS
    // ==========================================

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @PostMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/questions")
    public ResponseEntity<Questions> createQuestion(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long activityId,
            @RequestBody @Valid QuestionCreateRequestDto request) {
        return ResponseEntity.ok(courseService.createQuestion(request));
    }

    @GetMapping("/questions/{id}")
    public ResponseEntity<QuestionGetResponseDto> getQuestionById(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getQuestionById(id));
    }

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @PutMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/questions/{id}")
    public ResponseEntity<Questions> updateQuestion(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long activityId,
            @PathVariable Long id,
            @RequestBody @Valid QuestionUpdateRequestDto request) {
        return ResponseEntity.ok(courseService.updateQuestion(id, request));
    }

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @DeleteMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/questions/{id}")
    public ResponseEntity<GenericResponse> deleteQuestion(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long activityId,
            @PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteQuestion(id));
    }

    // ==========================================
    // ALTERNATIVES
    // ==========================================

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @PostMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/questions/{questionId}/alternatives")
    public ResponseEntity<Alternatives> createAlternative(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long activityId,
            @PathVariable Long questionId,
            @RequestBody @Valid AlternativeCreateRequestDto request) {
        return ResponseEntity.ok(courseService.createAlternative(request));
    }

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @PutMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/questions/{questionId}/alternatives/{id}")
    public ResponseEntity<Alternatives> updateAlternative(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long activityId,
            @PathVariable Long questionId,
            @PathVariable Long id,
            @RequestBody @Valid AlternativeUpdateRequestDto request) {
        return ResponseEntity.ok(courseService.updateAlternative(id, request));
    }

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @DeleteMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/questions/{questionId}/alternatives/{id}")
    public ResponseEntity<GenericResponse> deleteAlternative(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long activityId,
            @PathVariable Long questionId,
            @PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteAlternative(id));
    }

    // ==========================================
    // ESSAYS
    // ==========================================

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @PostMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/questions/{questionId}/essays")
    public ResponseEntity<Essays> createEssay(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long activityId,
            @PathVariable Long questionId,
            @RequestBody @Valid EssayCreateRequestDto request) {
        return ResponseEntity.ok(courseService.createEssay(request));
    }

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @PutMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/questions/{questionId}/essays/{id}")
    public ResponseEntity<Essays> updateEssay(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long activityId,
            @PathVariable Long questionId,
            @PathVariable Long id,
            @RequestBody @Valid EssayUpdateRequestDto request) {
        return ResponseEntity.ok(courseService.updateEssay(id, request));
    }

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @DeleteMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/questions/{questionId}/essays/{id}")
    public ResponseEntity<GenericResponse> deleteEssay(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long activityId,
            @PathVariable Long questionId,
            @PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteEssay(id));
    }

    // ==========================================
    // SUBMISSIONS & ANSWERS
    // ==========================================

    @GetMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/submissions/{id}")
    public ResponseEntity<ActivitySubmissionResponseDto> getActivitySubmissionById(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getActivitySubmissionById(id));
    }

    @GetMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/submissions")
    public ResponseEntity<List<ActivitySubmissionResponseDto>> getSubmissionsByActivityId(@PathVariable Long activityId) {
        return ResponseEntity.ok(courseService.getSubmissionsByActivityId(activityId));
    }

    @GetMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/submissions/users/{userId}")
    public ResponseEntity<List<ActivitySubmissionResponseDto>> getSubmissionsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(courseService.getSubmissionsByUserId(userId));
    }

    @PutMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/submissions/{id}")
    public ResponseEntity<GenericResponse> updateActivitySubmission(
            @PathVariable Long id,
            @RequestBody @Valid ActivitySubmissionUpdateRequestDto request) {
        return ResponseEntity.ok(courseService.updateActivitySubmission(id, request));
    }

    @DeleteMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/submissions/{id}")
    public ResponseEntity<GenericResponse> deleteActivitySubmission(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteActivitySubmission(id));
    }

    @GetMapping("/student-answers/{id}")
    public ResponseEntity<StudentAnswerResponseDto> getStudentAnswerById(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getStudentAnswerById(id));
    }

    @GetMapping("/submissions/{submissionId}/answers")
    public ResponseEntity<List<StudentAnswerResponseDto>> getAnswersBySubmissionId(@PathVariable Long submissionId) {
        return ResponseEntity.ok(courseService.getAnswersBySubmissionId(submissionId));
    }

    @PutMapping("/student-answers/{id}")
    public ResponseEntity<StudentAnswerResponseDto> updateStudentAnswer(
            @PathVariable Long id,
            @RequestBody @Valid StudentAnswerUpdateRequestDto request) {
        return ResponseEntity.ok(courseService.updateStudentAnswer(id, request));
    }

    @DeleteMapping("/student-answers/{id}")
    public ResponseEntity<GenericResponse> deleteStudentAnswer(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteStudentAnswer(id));
    }

    @PostMapping("/submitAnswer")
    public ResponseEntity<ActivitySubmissionResponseDto> submitActivity(
            @AuthenticationPrincipal CustomUserDetails loggedUser,
            @RequestBody @Valid SubmitActivityRequestDto data) {
        return ResponseEntity.ok(courseService.correctSubmission(data, loggedUser));
    }
}