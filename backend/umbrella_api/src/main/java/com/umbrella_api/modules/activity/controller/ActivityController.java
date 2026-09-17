package com.umbrella_api.modules.activity.controller;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.modules.activity.api.ActivityService;
import com.umbrella_api.modules.activity.dto.*;
import com.umbrella_api.modules.activity.model.Activities;
import com.umbrella_api.modules.activity.model.Alternatives;
import com.umbrella_api.modules.activity.model.Essays;
import com.umbrella_api.modules.activity.model.Questions;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/public/courses")
public class ActivityController {
    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
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
        return ResponseEntity.ok(activityService.createActivity(request));
    }

    @GetMapping("/activities/{id}")
    public ResponseEntity<ActivityGetResponseDto> getActivityById(@PathVariable Long id) {
        ActivityGetResponseDto responseDto = ActivityGetResponseDto.fromEntity(activityService.getActivityById(id));
        return ResponseEntity.ok(responseDto);
    }

    @GetMapping("/modules/{moduleId}/activities")
    public ResponseEntity<List<ActivityGetResponseDto>> getActivitiesByModuleId(@PathVariable Long moduleId) {
        return ResponseEntity.ok(activityService.getActivitiesByModuleId(moduleId));
    }

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @PutMapping("/{courseId}/modules/{moduleId}/activities/{id}")
    public ResponseEntity<Activities> updateActivity(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long id,
            @RequestBody @Valid ActivityUpdateRequestDto request) {
        return ResponseEntity.ok(activityService.updateActivity(id, request));
    }

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @DeleteMapping("/{courseId}/modules/{moduleId}/activities/{id}")
    public ResponseEntity<GenericResponse> deleteActivity(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long id) {
        return ResponseEntity.ok(activityService.deleteActivity(id));
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
        return ResponseEntity.ok(activityService.createQuestion(request));
    }

    @GetMapping("/questions/{id}")
    public ResponseEntity<QuestionGetResponseDto> getQuestionById(@PathVariable Long id) {
        return ResponseEntity.ok(QuestionGetResponseDto.fromEntity(activityService.getQuestionById(id)));
    }

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @PutMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/questions/{id}")
    public ResponseEntity<Questions> updateQuestion(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long activityId,
            @PathVariable Long id,
            @RequestBody @Valid QuestionUpdateRequestDto request) {
        return ResponseEntity.ok(activityService.updateQuestion(id, request));
    }

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @DeleteMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/questions/{id}")
    public ResponseEntity<GenericResponse> deleteQuestion(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long activityId,
            @PathVariable Long id) {
        return ResponseEntity.ok(activityService.deleteQuestion(id));
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
        return ResponseEntity.ok(activityService.createAlternative(request));
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
        return ResponseEntity.ok(activityService.updateAlternative(id, request));
    }

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @DeleteMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/questions/{questionId}/alternatives/{id}")
    public ResponseEntity<GenericResponse> deleteAlternative(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long activityId,
            @PathVariable Long questionId,
            @PathVariable Long id) {
        return ResponseEntity.ok(activityService.deleteAlternative(id));
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
        return ResponseEntity.ok(activityService.createEssay(request));
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
        return ResponseEntity.ok(activityService.updateEssay(id, request));
    }

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @DeleteMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/questions/{questionId}/essays/{id}")
    public ResponseEntity<GenericResponse> deleteEssay(
            @PathVariable Long courseId,
            @PathVariable Long moduleId,
            @PathVariable Long activityId,
            @PathVariable Long questionId,
            @PathVariable Long id) {
        return ResponseEntity.ok(activityService.deleteEssay(id));
    }
}
