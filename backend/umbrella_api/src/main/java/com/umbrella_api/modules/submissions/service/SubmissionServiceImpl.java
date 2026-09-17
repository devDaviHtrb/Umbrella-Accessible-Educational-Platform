package com.umbrella_api.modules.submissions.service;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.submissions.api.SubmissionService;
import com.umbrella_api.modules.submissions.dto.*;
import com.umbrella_api.modules.submissions.infra.SubmissionsProvider;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SubmissionServiceImpl implements SubmissionService {
    private final SubmissionsProvider submissionsProvider;

    public SubmissionServiceImpl(SubmissionsProvider submissionsProvider) {
        this.submissionsProvider = submissionsProvider;
    }
    // ==========================================
    // ACTIVITY SUBMISSIONS CRUD
    // ==========================================

    @Override
    public ActivitySubmissionResponseDto getActivitySubmissionById(Long id) {
        ActivitySubmissionResponseDto dto = submissionsProvider.getActivitySubmissionById(id);
        if (dto == null) {
            throw new EntityNotFoundException("Activity submission not found");
        }
        return dto;
    }

    @Override
    public List<ActivitySubmissionResponseDto> getSubmissionsByActivityId(Long activityId) {
        return submissionsProvider.getSubmissionsByActivityId(activityId);
    }

    @Override
    public List<ActivitySubmissionResponseDto> getSubmissionsByUserId(Long userId) {
        return submissionsProvider.getSubmissionsByUserId(userId);
    }

    @Override
    public GenericResponse updateActivitySubmission(Long id, ActivitySubmissionUpdateRequestDto request) {
        return submissionsProvider.updateActivitySubmission(id, request);
    }

    @Override
    public GenericResponse deleteActivitySubmission(Long id) {
        return submissionsProvider.deleteActivitySubmission(id);
    }

    // ==========================================
    // STUDENT ANSWERS CRUD
    // ==========================================

    @Override
    public StudentAnswerResponseDto getStudentAnswerById(Long id) {
        StudentAnswerResponseDto dto = submissionsProvider.getStudentAnswerById(id);
        if (dto == null) {
            throw new EntityNotFoundException("Student answer not found");
        }
        return dto;
    }

    @Override
    public List<StudentAnswerResponseDto> getAnswersBySubmissionId(Long submissionId) {
        return submissionsProvider.getAnswersBySubmissionId(submissionId);
    }

    @Override
    public StudentAnswerResponseDto updateStudentAnswer(Long id, StudentAnswerUpdateRequestDto request) {
        return submissionsProvider.updateStudentAnswer(id, request);
    }

    @Override
    public GenericResponse deleteStudentAnswer(Long id) {
        return submissionsProvider.deleteStudentAnswer(id);
    }

    @Override
    public ActivitySubmissionResponseDto correctSubmission(SubmitActivityRequestDto request, CustomUserDetails user) {
        return submissionsProvider.correctSubmission(request, user);
    }

    @Override
    public ActivitySubmissionResponseDto submitAndCorrectActivity(SubmitActivityRequestDto request, CustomUserDetails user) {
        return submissionsProvider.correctSubmission(request, user);
    }
}
