package com.umbrella_api.modules.submissions.controller;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.submissions.api.SubmissionService;
import com.umbrella_api.modules.submissions.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/courses")
public class SubmissionController {
    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }
    // ==========================================
    // SUBMISSIONS & ANSWERS
    // ==========================================

    @PostMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/submit")
    public ResponseEntity<ActivitySubmissionResponseDto> submitActivity(
            @Valid @RequestBody SubmitActivityRequestDto request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        ActivitySubmissionResponseDto response = submissionService.submitAndCorrectActivity(request, userDetails);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/submissions/{id}")
    public ResponseEntity<ActivitySubmissionResponseDto> getActivitySubmissionById(@PathVariable Long id) {
        return ResponseEntity.ok(submissionService.getActivitySubmissionById(id));
    }

    @GetMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/submissions")
    public ResponseEntity<List<ActivitySubmissionResponseDto>> getSubmissionsByActivityId(@PathVariable Long activityId) {
        return ResponseEntity.ok(submissionService.getSubmissionsByActivityId(activityId));
    }

    @GetMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/submissions/users/{userId}")
    public ResponseEntity<List<ActivitySubmissionResponseDto>> getSubmissionsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(submissionService.getSubmissionsByUserId(userId));
    }

    @PutMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/submissions/{id}")
    public ResponseEntity<GenericResponse> updateActivitySubmission(
            @PathVariable Long id,
            @RequestBody @Valid ActivitySubmissionUpdateRequestDto request) {
        return ResponseEntity.ok(submissionService.updateActivitySubmission(id, request));
    }

    @DeleteMapping("/{courseId}/modules/{moduleId}/activities/{activityId}/submissions/{id}")
    public ResponseEntity<GenericResponse> deleteActivitySubmission(@PathVariable Long id) {
        return ResponseEntity.ok(submissionService.deleteActivitySubmission(id));
    }

    @GetMapping("/student-answers/{id}")
    public ResponseEntity<StudentAnswerResponseDto> getStudentAnswerById(@PathVariable Long id) {
        return ResponseEntity.ok(submissionService.getStudentAnswerById(id));
    }

    @GetMapping("/submissions/{submissionId}/answers")
    public ResponseEntity<List<StudentAnswerResponseDto>> getAnswersBySubmissionId(@PathVariable Long submissionId) {
        return ResponseEntity.ok(submissionService.getAnswersBySubmissionId(submissionId));
    }

    @PutMapping("/student-answers/{id}")
    public ResponseEntity<StudentAnswerResponseDto> updateStudentAnswer(
            @PathVariable Long id,
            @RequestBody @Valid StudentAnswerUpdateRequestDto request) {
        return ResponseEntity.ok(submissionService.updateStudentAnswer(id, request));
    }

    @DeleteMapping("/student-answers/{id}")
    public ResponseEntity<GenericResponse> deleteStudentAnswer(@PathVariable Long id) {
        return ResponseEntity.ok(submissionService.deleteStudentAnswer(id));
    }



}
