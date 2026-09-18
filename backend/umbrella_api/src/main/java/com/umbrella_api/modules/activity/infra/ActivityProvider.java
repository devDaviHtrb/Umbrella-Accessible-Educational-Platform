package com.umbrella_api.modules.activity.infra;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.modules.activity.dto.*;
import com.umbrella_api.modules.activity.model.Activities;
import com.umbrella_api.modules.activity.model.Alternatives;
import com.umbrella_api.modules.activity.model.Essays;
import com.umbrella_api.modules.activity.model.Questions;
import com.umbrella_api.modules.activity.repository.ActivitiesRepository;
import com.umbrella_api.modules.activity.repository.AlternativesRepository;
import com.umbrella_api.modules.activity.repository.EssaysRepository;
import com.umbrella_api.modules.activity.repository.QuestionsRepository;
import com.umbrella_api.modules.course.api.CourseService;
import com.umbrella_api.modules.course.model.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class ActivityProvider {
    private final ActivitiesRepository activitiesRepository;
    private final QuestionsRepository questionsRepository;
    private final AlternativesRepository alternativesRepository;
    private final EssaysRepository essaysRepository;
    private final CourseService courseService;

    public ActivityProvider(ActivitiesRepository activitiesRepository, QuestionsRepository questionsRepository, AlternativesRepository alternativesRepository, EssaysRepository essaysRepository, CourseService courseService) {
        this.activitiesRepository = activitiesRepository;
        this.questionsRepository = questionsRepository;
        this.alternativesRepository = alternativesRepository;
        this.essaysRepository = essaysRepository;
        this.courseService = courseService;
    }

    @Transactional
    public Activities createActivity(ActivityCreateRequestDto request) {
        Modules moduleOpt = courseService.getModuleById(request.moduleId());

        Activities activity = Activities.builder()
                .title(request.title())
                .test(request.test())
                .maxScore(request.maxScore())
                .status(request.status() != null ? request.status() : "awaiting the data dict")
                .module(moduleOpt)
                .build();

        activitiesRepository.save(activity);
        return activity;
    }

    public Activities getActivityById(Long id) {
        return activitiesRepository.findById(id).orElseThrow(()->new EntityNotFoundException("Activity not found."));
    }

    public List<ActivityGetResponseDto> getActivitiesByModuleId(Long moduleId) {
        List<Activities> activities = activitiesRepository.findByModuleId(moduleId);
        return ActivityGetResponseDto.fromEntityList(activities);
    }

    @Transactional
    public Activities updateActivity(Long id, ActivityUpdateRequestDto request) {
        Activities activity = this.getActivityById(id);

        if (request.title() != null)
            activity.setTitle(request.title());
        if (request.test() != null)
            activity.setTest(request.test());
        if (request.maxScore() != null)
            activity.setMaxScore(request.maxScore());
        if (request.status() != null)
            activity.setStatus(request.status());

        if (request.moduleId() != null) {
            Modules moduleOpt = courseService.getModuleById(request.moduleId());
            activity.setModule(moduleOpt);
        }

        activitiesRepository.save(activity);
        return activity;

    }

    @Transactional
    public GenericResponse deleteActivity(Long id) {
        if(!activitiesRepository.existsById(id)){
            throw new EntityNotFoundException("Activity not found");
        }

        // implements if images will can used in questions
        /*
         * Activities activity = activityOpt.get()
         * if (activity.getQuestions() != null) {
         * for (Questions question : activity.getQuestions()) {
         * storageService.deleteAllFilesByQuestionId(question.getId());
         * }
         * }
         */
        activitiesRepository.deleteById(id);
        return new GenericResponse("ok", "Success on delete activity", 200);

    }

    // ==========================================
    // QUESTIONS CRUD
    // ==========================================

    @Transactional
    public Questions createQuestion(QuestionCreateRequestDto request) {

        Activities activity = this.getActivityById(request.activityId());

        Questions question = Questions.builder()
                .points(request.points())
                .status(request.status() != null ? request.status() : "awaiting the data dict")
                .number(request.number())
                .statement(request.statement())
                .activity(activity)
                .build();

        questionsRepository.save(question);
        return question;

    }

    public Questions getQuestionById(Long id) {
        return questionsRepository.findById(id).orElseThrow(()->new EntityNotFoundException("Question not found"));
    }

    @Transactional
    public Questions updateQuestion(Long id, QuestionUpdateRequestDto request) {
        Questions question = this.getQuestionById(id);

        if (request.points() != null)
            question.setPoints(request.points());
        if (request.status() != null)
            question.setStatus(request.status());
        if (request.number() != null)
            question.setNumber(request.number());
        if (request.statement() != null)
            question.setStatement(request.statement());

        questionsRepository.save(question);
        return question;

    }

    @Transactional
    public GenericResponse deleteQuestion(Long id) {

        if (!questionsRepository.existsById(id)) {
            throw new EntityNotFoundException("Question not found");
        }

        // Implements if images will can used in questions
        // storageService.deleteAllFilesByQuestionId(id);

        questionsRepository.deleteById(id);
        return new GenericResponse("ok", "Success on delete question", 200);

    }

    // ==========================================
    // ALTERNATIVES CRUD
    // ==========================================

    @Transactional
    public Alternatives createAlternative(AlternativeCreateRequestDto request) {
       Questions question = this.getQuestionById(request.questionId());

        Alternatives alternative = Alternatives.builder()
                .correct(request.correct())
                .letter(request.letter())
                .text(request.text())
                .question(question)
                .build();

        alternativesRepository.save(alternative);
        return alternative;

    }

    @Transactional
    public Alternatives updateAlternative(Long id, AlternativeUpdateRequestDto request) {
        Alternatives alternative = this.getAlternativeById(id);

        if (request.correct() != null)
            alternative.setCorrect(request.correct());
        if (request.letter() != null)
            alternative.setLetter(request.letter());
        if (request.text() != null)
            alternative.setText(request.text());

        alternativesRepository.save(alternative);
        return alternative;
    }

    @Transactional
    public GenericResponse deleteAlternative(Long id) {

        if (!alternativesRepository.existsById(id)) {
            throw new EntityNotFoundException("Alternative not found");
        }

        alternativesRepository.deleteById(id);
        return new GenericResponse("ok", "Success on delete alternative", 200);

    }

    @Transactional
    public Alternatives getAlternativeById(Long id){
        return alternativesRepository.findById(id).orElseThrow(()->new EntityNotFoundException("Alternative not found"));  }

    // ==========================================
    // ESSAYS CRUD
    // ==========================================

    @Transactional
    public Essays createEssay(EssayCreateRequestDto request) {
        Questions question = this.getQuestionById(request.questionId());

        Essays essay = Essays.builder()
                .expectedAnswer(request.expectedAnswer())
                .minLetters(request.minLetters())
                .maxLetters(request.maxLetters())
                .question(question)
                .build();

        essaysRepository.save(essay);
        return essay;

    }

    @Transactional
    public Essays updateEssay(Long id, EssayUpdateRequestDto request) {

        Optional<Essays> essayOpt = essaysRepository.findById(id);
        if (essayOpt.isEmpty()) {
            throw new EntityNotFoundException("Essay not found");
        }

        Essays essay = essayOpt.get();

        if (request.expectedAnswer() != null)
            essay.setExpectedAnswer(request.expectedAnswer());
        if (request.minLetters() != null)
            essay.setMinLetters(request.minLetters());
        if (request.maxLetters() != null)
            essay.setMaxLetters(request.maxLetters());

        essaysRepository.save(essay);
        return essay;

    }

    @Transactional
    public GenericResponse deleteEssay(Long id) {

        if (!essaysRepository.existsById(id)) {
           throw new EntityNotFoundException("Essay not found");
        }

        essaysRepository.deleteById(id);
        return new GenericResponse("ok", "Success on delete essay criteria", 200);

    }
}
