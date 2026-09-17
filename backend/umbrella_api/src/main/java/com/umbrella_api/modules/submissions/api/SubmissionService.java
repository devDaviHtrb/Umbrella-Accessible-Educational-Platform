package com.umbrella_api.modules.submissions.api;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.submissions.dto.*;

import java.util.List;

public interface SubmissionService {
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

    public ActivitySubmissionResponseDto submitAndCorrectActivity(SubmitActivityRequestDto request, CustomUserDetails user);
}
