package com.umbrella_api.modules.course.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.course.api.CourseService;
import com.umbrella_api.modules.course.dto.ActivityCreateRequestDto;
import com.umbrella_api.modules.course.dto.ActivityGetResponseDto;
import com.umbrella_api.modules.course.dto.ActivitySubmissionResponseDto;
import com.umbrella_api.modules.course.dto.ActivitySubmissionUpdateRequestDto;
import com.umbrella_api.modules.course.dto.ActivityUpdateRequestDto;
import com.umbrella_api.modules.course.dto.AlternativeCreateRequestDto;
import com.umbrella_api.modules.course.dto.AlternativeUpdateRequestDto;
import com.umbrella_api.modules.course.dto.CourseDto;
import com.umbrella_api.modules.course.dto.CourseGetResponseDto;
import com.umbrella_api.modules.course.dto.CourseResponseDto;
import com.umbrella_api.modules.course.dto.EssayCreateRequestDto;
import com.umbrella_api.modules.course.dto.EssayUpdateRequestDto;
import com.umbrella_api.modules.course.dto.ModuleRequestDto;
import com.umbrella_api.modules.course.dto.ModulesResponseDto;
import com.umbrella_api.modules.course.dto.QuestionCreateRequestDto;
import com.umbrella_api.modules.course.dto.QuestionGetResponseDto;
import com.umbrella_api.modules.course.dto.QuestionUpdateRequestDto;
import com.umbrella_api.modules.course.dto.StudentAnswerResponseDto;
import com.umbrella_api.modules.course.dto.StudentAnswerUpdateRequestDto;
import com.umbrella_api.modules.course.dto.SubjectsResponseDto;
import com.umbrella_api.modules.course.dto.SubmitActivityRequestDto;
import com.umbrella_api.modules.course.dto.UpdateModuleDto;
import com.umbrella_api.modules.course.model.Courses;
import com.umbrella_api.modules.course.model.Modules;
import com.umbrella_api.modules.user.model.UserModel;

import jakarta.validation.Valid;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

@RestController
@RequestMapping("/api/public/courses")
public class CourseController {
    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @PostMapping("/register")
    public ResponseEntity<GenericResponse> registerCourse(@RequestBody @Valid CourseDto courseData,
            @AuthenticationPrincipal CustomUserDetails loggedUser) {

        return ResponseEntity.ok(courseService.createCourse(courseData, loggedUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseResponseDto> getCourseById(@PathVariable long id) {
        Courses course = courseService.getCourseById(id);
        UserModel creator = courseService.getCourseCreatorById(id);
        return ResponseEntity.ok(CourseResponseDto.fromEntity(course, creator));
    }

    @PostMapping("/add_module")
    public ResponseEntity<GenericResponse> addModule(@RequestBody @Valid ModuleRequestDto moduleData) {
        return ResponseEntity.ok(courseService.createModule(moduleData));
    }

    @PutMapping("/modules/{id}")
    public ResponseEntity<GenericResponse> updateModule(@PathVariable Long id,
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

    @DeleteMapping("/{id}")
    public ResponseEntity<GenericResponse> deleteCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteCourse(id));
    }

    @DeleteMapping("/modules/{id}")
    public ResponseEntity<GenericResponse> deleteModule(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteModule(id));
    }

    // Create errollment crud
    @PostMapping("/{id}/enrrolment/{userId}")
    public ResponseEntity<GenericResponse> createUserRelation(@PathVariable Long id, @PathVariable Long userId) {
        return ResponseEntity.ok(courseService.createUserRelation(userId, id));
    }

    @DeleteMapping("/{id}/enrrolment/{userId}")
    public ResponseEntity<GenericResponse> deleteUserRelation(@PathVariable Long id, @PathVariable Long userId) {
        return ResponseEntity.ok(courseService.deleteUserRelation(userId, id));
    }

    @PostMapping("/subjects/register")
    public ResponseEntity<GenericResponse> newSubject(@RequestBody String name) {
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
    // ACTIVITIES CRUD
    // ==========================================

    @PostMapping("/activities")
    public ResponseEntity<GenericResponse> createActivity(@RequestBody @Valid ActivityCreateRequestDto request) {
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

    @PutMapping("/activities/{id}")
    public ResponseEntity<GenericResponse> updateActivity(
            @PathVariable Long id,
            @RequestBody @Valid ActivityUpdateRequestDto request) {
        return ResponseEntity.ok(courseService.updateActivity(id, request));
    }

    @DeleteMapping("/activities/{id}")
    public ResponseEntity<GenericResponse> deleteActivity(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteActivity(id));
    }

    // ==========================================
    // QUESTIONS CRUD
    // ==========================================

    @PostMapping("/questions")
    public ResponseEntity<GenericResponse> createQuestion(@RequestBody @Valid QuestionCreateRequestDto request) {
        return ResponseEntity.ok(courseService.createQuestion(request));
    }

    @GetMapping("/questions/{id}")
    public ResponseEntity<QuestionGetResponseDto> getQuestionById(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getQuestionById(id));
    }

    @PutMapping("/questions/{id}")
    public ResponseEntity<GenericResponse> updateQuestion(
            @PathVariable Long id,
            @RequestBody @Valid QuestionUpdateRequestDto request) {
        return ResponseEntity.ok(courseService.updateQuestion(id, request));
    }

    @DeleteMapping("/questions/{id}")
    public ResponseEntity<GenericResponse> deleteQuestion(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteQuestion(id));
    }

    // ==========================================
    // ALTERNATIVES CRUD
    // ==========================================

    @PostMapping("/alternatives")
    public ResponseEntity<GenericResponse> createAlternative(@RequestBody @Valid AlternativeCreateRequestDto request) {
        return ResponseEntity.ok(courseService.createAlternative(request));
    }

    @PutMapping("/alternatives/{id}")
    public ResponseEntity<GenericResponse> updateAlternative(
            @PathVariable Long id,
            @RequestBody @Valid AlternativeUpdateRequestDto request) {
        return ResponseEntity.ok(courseService.updateAlternative(id, request));
    }

    @DeleteMapping("/alternatives/{id}")
    public ResponseEntity<GenericResponse> deleteAlternative(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteAlternative(id));
    }

    // ==========================================
    // ESSAYS CRUD
    // ==========================================

    @PostMapping("/essays")
    public ResponseEntity<GenericResponse> createEssay(@RequestBody @Valid EssayCreateRequestDto request) {
        return ResponseEntity.ok(courseService.createEssay(request));
    }

    @PutMapping("/essays/{id}")
    public ResponseEntity<GenericResponse> updateEssay(
            @PathVariable Long id,
            @RequestBody @Valid EssayUpdateRequestDto request) {
        return ResponseEntity.ok(courseService.updateEssay(id, request));
    }

    @DeleteMapping("/essays/{id}")
    public ResponseEntity<GenericResponse> deleteEssay(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteEssay(id));
    }

    // ==========================================
    // ACTIVITY SUBMISSIONS CRUD
    // ==========================================

    @GetMapping("/submissions/{id}")
    public ResponseEntity<ActivitySubmissionResponseDto> getActivitySubmissionById(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getActivitySubmissionById(id));
    }

    @GetMapping("/activities/{activityId}/submissions")
    public ResponseEntity<List<ActivitySubmissionResponseDto>> getSubmissionsByActivityId(
            @PathVariable Long activityId) {
        return ResponseEntity.ok(courseService.getSubmissionsByActivityId(activityId));
    }

    @GetMapping("/users/{userId}/submissions")
    public ResponseEntity<List<ActivitySubmissionResponseDto>> getSubmissionsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(courseService.getSubmissionsByUserId(userId));
    }

    @PutMapping("/submissions/{id}")
    public ResponseEntity<GenericResponse> updateActivitySubmission(
            @PathVariable Long id,
            @RequestBody @Valid ActivitySubmissionUpdateRequestDto request) {
        return ResponseEntity.ok(courseService.updateActivitySubmission(id, request));
    }

    @DeleteMapping("/submissions/{id}")
    public ResponseEntity<GenericResponse> deleteActivitySubmission(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteActivitySubmission(id));
    }

    // ==========================================
    // STUDENT ANSWERS CRUD
    // ==========================================

    @GetMapping("/student-answers/{id}")
    public ResponseEntity<StudentAnswerResponseDto> getStudentAnswerById(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getStudentAnswerById(id));
    }

    @GetMapping("/submissions/{submissionId}/answers")
    public ResponseEntity<List<StudentAnswerResponseDto>> getAnswersBySubmissionId(@PathVariable Long submissionId) {
        return ResponseEntity.ok(courseService.getAnswersBySubmissionId(submissionId));
    }

    @PutMapping("/student-answers/{id}")
    public ResponseEntity<GenericResponse> updateStudentAnswer(
            @PathVariable Long id,
            @RequestBody @Valid StudentAnswerUpdateRequestDto request) {
        return ResponseEntity.ok(courseService.updateStudentAnswer(id, request));
    }

    @DeleteMapping("/student-answers/{id}")
    public ResponseEntity<GenericResponse> deleteStudentAnswer(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteStudentAnswer(id));
    }

    @PostMapping("/submitAnswer")
    public ResponseEntity<GenericResponse> submitActivity(@AuthenticationPrincipal CustomUserDetails loggedUser,
            @RequestBody @Valid SubmitActivityRequestDto data) {

        return ResponseEntity.ok(courseService.correctSubmission(data, loggedUser));
    }

}
