package com.umbrella_api.modules.submissions.infra;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.activity.api.ActivityService;
import com.umbrella_api.modules.activity.model.Activities;
import com.umbrella_api.modules.activity.model.Alternatives;
import com.umbrella_api.modules.activity.model.Questions;
import com.umbrella_api.modules.submissions.dto.*;
import com.umbrella_api.modules.submissions.model.ActivitySubmissions;
import com.umbrella_api.modules.submissions.model.StudentAnswers;
import com.umbrella_api.modules.submissions.repository.ActivitySubmissionsRepository;
import com.umbrella_api.modules.submissions.repository.StudentAnswersRepository;
import com.umbrella_api.modules.user.model.UserModel;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class SubmissionsProvider {

    private final StudentAnswersRepository studentAnswersRepository;
    private final ActivitySubmissionsRepository activitySubmissionsRepository;
    private final ActivityService activityService;

    public SubmissionsProvider(StudentAnswersRepository studentAnswersRepository,
                               ActivitySubmissionsRepository activitySubmissionsRepository,
                               ActivityService activityService) {
        this.studentAnswersRepository = studentAnswersRepository;
        this.activitySubmissionsRepository = activitySubmissionsRepository;
        this.activityService = activityService;
    }

    @Transactional
    public ActivitySubmissions createActivitySubmission(Long activityId, CustomUserDetails userDetails) {
        UserModel user = userDetails.getUserModel();
        Activities activity = activityService.getActivityById(activityId);

        ActivitySubmissions submission = ActivitySubmissions.builder()
                .user(user)
                .activity(activity)
                .score(0f)
                .status("IN_PROGRESS")
                .submittedAt(LocalDateTime.now())
                .answers(new ArrayList<>())
                .build();

        return activitySubmissionsRepository.save(submission);
    }

    public ActivitySubmissionResponseDto getActivitySubmissionById(Long id) {
        return activitySubmissionsRepository.findById(id)
                .map(ActivitySubmissionResponseDto::fromEntity)
                .orElse(null);
    }

    public List<ActivitySubmissionResponseDto> getSubmissionsByActivityId(Long activityId) {
        return ActivitySubmissionResponseDto.fromEntityList(activitySubmissionsRepository.findByActivityId(activityId));
    }

    public List<ActivitySubmissionResponseDto> getSubmissionsByUserId(Long userId) {
        return ActivitySubmissionResponseDto.fromEntityList(activitySubmissionsRepository.findByUserId(userId));
    }

    @Transactional
    public GenericResponse updateActivitySubmission(Long id, ActivitySubmissionUpdateRequestDto request) {
        ActivitySubmissions submission = activitySubmissionsRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Activity submission not found"));

        if (request.score() != null) submission.setScore(request.score());
        if (request.status() != null) submission.setStatus(request.status());

        activitySubmissionsRepository.save(submission);
        return new GenericResponse("ok", "Success on update activity submission", 200);
    }

    @Transactional
    public GenericResponse deleteActivitySubmission(Long id) {
        if (!activitySubmissionsRepository.existsById(id)) {
            return new GenericResponse("Error", "Activity submission not found", 404);
        }
        studentAnswersRepository.deleteBySubmissionId(id);
        activitySubmissionsRepository.deleteById(id);
        return new GenericResponse("ok", "Success on delete activity submission", 200);
    }

    public StudentAnswerResponseDto getStudentAnswerById(Long id) {
        return studentAnswersRepository.findById(id)
                .map(StudentAnswerResponseDto::fromEntity)
                .orElse(null);
    }

    public List<StudentAnswerResponseDto> getAnswersBySubmissionId(Long submissionId) {
        return studentAnswersRepository.findBySubmissionId(submissionId)
                .stream()
                .map(StudentAnswerResponseDto::fromEntity)
                .toList();
    }

    @Transactional
    public StudentAnswerResponseDto updateStudentAnswer(Long id, StudentAnswerUpdateRequestDto request) {
        StudentAnswers answer = studentAnswersRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Answer not found"));

        if (request.chosenAlternativeId() != null) {
            Alternatives altOpt = activityService.getAlternativeById(request.chosenAlternativeId());
            answer.setChosenAlternative(altOpt);
        }
        if (request.essayAnswer() != null) answer.setEssayAnswer(request.essayAnswer());
        if (request.isCorrect() != null) answer.setIsCorrect(request.isCorrect());

        studentAnswersRepository.save(answer);
        return StudentAnswerResponseDto.fromEntity(answer);
    }

    @Transactional
    public GenericResponse deleteStudentAnswer(Long id) {
        if (!studentAnswersRepository.existsById(id)) {
            return new GenericResponse("Error", "Student answer not found", 404);
        }
        studentAnswersRepository.deleteById(id);
        return new GenericResponse("ok", "Success on delete student answer", 200);
    }

    @Transactional
    public ActivitySubmissionResponseDto correctSubmission(SubmitActivityRequestDto request, CustomUserDetails userDetails) {
        ActivitySubmissions submission = this.createActivitySubmission(request.activityId(), userDetails);

        float totalScore = 0f;
        boolean hasPendingEssay = false;

        for (StudentAnswerCorrectionDto answerDto : request.answers()) {
            Questions question = activityService.getQuestionById(answerDto.questionId());
            Alternatives chosenAlternative = null;
            Boolean isCorrect = null;

            if (answerDto.chosenAlternativeId() != null) {
                chosenAlternative = activityService.getAlternativeById(answerDto.chosenAlternativeId());
                if (chosenAlternative.isCorrect()) {
                    isCorrect = true;
                    if (question.getPoints() != null) {
                        totalScore += question.getPoints();
                    }
                } else {
                    isCorrect = false;
                }
            } else if (answerDto.essayAnswer() != null) {
                hasPendingEssay = true;
            }

            StudentAnswers studentAnswer = StudentAnswers.builder()
                    .submission(submission)
                    .question(question)
                    .chosenAlternative(chosenAlternative)
                    .essayAnswer(answerDto.essayAnswer())
                    .isCorrect(isCorrect)
                    .build();

            studentAnswersRepository.save(studentAnswer);
            submission.getAnswers().add(studentAnswer);
        }

        submission.setScore(totalScore);
        submission.setStatus(hasPendingEssay ? "AWAITING_CORRECTION" : "COMPLETED");
        activitySubmissionsRepository.save(submission);

        return ActivitySubmissionResponseDto.fromEntity(submission);
    }
}