package com.umbrella_api.modules.submissions.infra;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.activity.api.ActivityService;
import com.umbrella_api.modules.activity.model.Activities;
import com.umbrella_api.modules.activity.model.Alternatives;
import com.umbrella_api.modules.activity.model.Essays;
import com.umbrella_api.modules.activity.model.Questions;
import com.umbrella_api.modules.ai.api.AiService;
import com.umbrella_api.modules.ai.dto.AiResponse;
import com.umbrella_api.modules.ai.service.GeminiService;
import com.umbrella_api.modules.submissions.dto.*;
import com.umbrella_api.modules.submissions.model.ActivitySubmissions;
import com.umbrella_api.modules.submissions.model.StudentAnswers;
import com.umbrella_api.modules.submissions.repository.ActivitySubmissionsRepository;
import com.umbrella_api.modules.submissions.repository.StudentAnswersRepository;
import com.umbrella_api.modules.user.model.UserModel;
import com.umbrella_api.modules.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class SubmissionsProvider {

    private final GeminiService geminiService;
    private final StudentAnswersRepository studentAnswersRepository;
    private final ActivitySubmissionsRepository activitySubmissionsRepository;
    private final ActivityService activityService;
    private final UserRepository userRepository;
    private final AiService aiService;

    public SubmissionsProvider(StudentAnswersRepository studentAnswersRepository,
            ActivitySubmissionsRepository activitySubmissionsRepository, ActivityService activityService,
            UserRepository userRepository, AiService aiService, GeminiService geminiService) {
        this.studentAnswersRepository = studentAnswersRepository;
        this.activitySubmissionsRepository = activitySubmissionsRepository;
        this.activityService = activityService;
        this.userRepository = userRepository;
        this.aiService = aiService;
        this.geminiService = geminiService;
    }

    @Transactional
    public ActivitySubmissions createActivitySubmission(Long activityId, CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUserModel() == null) {
            throw new IllegalArgumentException("Usuário não autenticado.");
        }
        UserModel user = userRepository.getReferenceById(userDetails.getUserModel().getId());
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

        if (request.score() != null)
            submission.setScore(request.score());
        if (request.status() != null)
            submission.setStatus(request.status());

        activitySubmissionsRepository.save(submission);
        return new GenericResponse("ok", "Success on update activity submission", 200);
    }

    @Transactional
    public GenericResponse deleteActivitySubmission(Long id) {
        if (!activitySubmissionsRepository.existsById(id)) {
            throw new EntityNotFoundException("Submission not found");
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
        if (request.essayAnswer() != null)
            answer.setEssayAnswer(request.essayAnswer());
        if (request.isCorrect() != null)
            answer.setIsCorrect(request.isCorrect());

        studentAnswersRepository.save(answer);
        return StudentAnswerResponseDto.fromEntity(answer);
    }

    @Transactional
    public GenericResponse deleteStudentAnswer(Long id) {
        if (!studentAnswersRepository.existsById(id)) {
            throw new EntityNotFoundException("Answer not found");
        }
        studentAnswersRepository.deleteById(id);
        return new GenericResponse("ok", "Success on delete student answer", 200);
    }

    @Transactional
    public ActivitySubmissionResponseDto correctSubmission(SubmitActivityRequestDto request,
            CustomUserDetails userDetails) {
        ActivitySubmissions submission = this.createActivitySubmission(request.activityId(), userDetails);

        float totalScore = 0f;

        for (StudentAnswerCorrectionDto answerDto : request.answers()) {
            Questions question = activityService.getQuestionById(answerDto.questionId());
            Alternatives chosenAlternative = null;
            Boolean isCorrect = null;
            float questionScore = 0f;

            if (answerDto.chosenAlternativeId() != null) {
                // ── Multiple choice ──────────────────────────────────────────────
                chosenAlternative = activityService.getAlternativeById(answerDto.chosenAlternativeId());
                if (chosenAlternative.isCorrect()) {
                    isCorrect = true;
                    questionScore = question.getPoints() != null ? question.getPoints() : 0f;
                } else {
                    isCorrect = false;
                }
                totalScore += questionScore;

            } else if (answerDto.essayAnswer() != null && !answerDto.essayAnswer().isBlank()) {
                // ── Essay: grade via Gemini ───────────────────────────────────────
                Essays essay = question.getEssay();
                float maxPoints = question.getPoints() != null ? question.getPoints() : 0f;

                if (essay != null && essay.getExpectedAnswer() != null && !essay.getExpectedAnswer().isBlank()) {
                    float aiScore = gradeEssayWithAi(
                            question.getStatement(),
                            essay.getExpectedAnswer(),
                            answerDto.essayAnswer(),
                            maxPoints);
                    questionScore = aiScore;
                    isCorrect = aiScore >= maxPoints * 0.5f; // >= 50% = considered correct
                } else {
                    // No expected answer provided by the professor → leave for manual review
                    questionScore = 0f;
                    isCorrect = null;
                }
                totalScore += questionScore;
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
        submission.setStatus("COMPLETED");
        activitySubmissionsRepository.save(submission);

        return ActivitySubmissionResponseDto.fromEntity(submission);
    }

    /**
     * Sends the student's essay answer to Gemini and asks it to return a numeric
     * score between 0 and {@code maxPoints}, based on how well the answer matches
     * the professor's expected answer.
     *
     * @param questionStatement the question text
     * @param expectedAnswer    the answer provided by the professor
     * @param studentAnswer     the answer written by the student
     * @param maxPoints         maximum points available for this question
     * @return score granted (0 ≤ score ≤ maxPoints)
     */
    private float gradeEssayWithAi(String questionStatement, String expectedAnswer,
            String studentAnswer, float maxPoints) {
        String prompt = String.format(
                "Você é um corretor acadêmico imparcial. Avalie a resposta do aluno abaixo comparando-a " +
                "com a resposta esperada pelo professor.\n\n" +
                "Questão: %s\n\n" +
                "Resposta esperada pelo professor: %s\n\n" +
                "Resposta do aluno: %s\n\n" +
                "Nota máxima para esta questão: %.1f pontos.\n\n" +
                "Responda APENAS com um número decimal entre 0 e %.1f representando a nota do aluno. " +
                "Não inclua texto adicional, apenas o número.",
                questionStatement, expectedAnswer, studentAnswer, maxPoints, maxPoints);

        try {
            AiResponse aiResponse = geminiService.requestAi(prompt);
            if (aiResponse != null && aiResponse.reply() != null) {
                String raw = aiResponse.reply().trim().replaceAll("[^0-9.,]", "").replace(",", ".");
                float parsed = Float.parseFloat(raw);
                return Math.max(0f, Math.min(parsed, maxPoints));
            }
        } catch (Exception e) {
            // If AI fails, fall back to 0 – submission is still saved
        }
        return 0f;
    }
}