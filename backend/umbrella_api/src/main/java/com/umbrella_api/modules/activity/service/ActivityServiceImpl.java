package com.umbrella_api.modules.activity.service;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.modules.activity.api.ActivityService;
import com.umbrella_api.modules.activity.dto.*;
import com.umbrella_api.modules.activity.infra.ActivityProvider;
import com.umbrella_api.modules.activity.model.Activities;
import com.umbrella_api.modules.activity.model.Alternatives;
import com.umbrella_api.modules.activity.model.Essays;
import com.umbrella_api.modules.activity.model.Questions;
import com.umbrella_api.modules.course.infra.CourseProvider;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ActivityServiceImpl implements ActivityService {
    private final ActivityProvider activityProvider;

    public ActivityServiceImpl(ActivityProvider activityProvider) {
        this.activityProvider = activityProvider;
    }

    @Override
    public Activities createActivity(ActivityCreateRequestDto request) {
        return activityProvider.createActivity(request);
    }

    @Override
    public Activities getActivityById(Long id) {
        Activities activity  = activityProvider.getActivityById(id);
        return activity;
    }

    @Override
    public List<ActivityGetResponseDto> getActivitiesByModuleId(Long moduleId) {
        return activityProvider.getActivitiesByModuleId(moduleId);
    }

    @Override
    public Activities updateActivity(Long id, ActivityUpdateRequestDto request) {
        return activityProvider.updateActivity(id, request);
    }

    @Override
    public GenericResponse deleteActivity(Long id) {
        return activityProvider.deleteActivity(id);
    }

    // ==========================================
    // QUESTIONS CRUD
    // ==========================================

    @Override
    public Questions createQuestion(QuestionCreateRequestDto request) {
        return activityProvider.createQuestion(request);
    }

    @Override
    public Questions getQuestionById(Long id) {
        Questions question = activityProvider.getQuestionById(id);
        return question;
    }

    @Override
    public Questions updateQuestion(Long id, QuestionUpdateRequestDto request) {
        return activityProvider.updateQuestion(id, request);
    }

    @Override
    public GenericResponse deleteQuestion(Long id) {
        return activityProvider.deleteQuestion(id);
    }

    // ==========================================
    // ALTERNATIVES CRUD
    // ==========================================

    @Override
    public Alternatives createAlternative(AlternativeCreateRequestDto request) {
        return activityProvider.createAlternative(request);
    }

    @Override
    public Alternatives updateAlternative(Long id, AlternativeUpdateRequestDto request) {
        return activityProvider.updateAlternative(id, request);
    }

    @Override
    public GenericResponse deleteAlternative(Long id) {
        return activityProvider.deleteAlternative(id);
    }

    @Override
    public Alternatives getAlternativeById(Long id){
        return  activityProvider.getAlternativeById(id);
    }
    // ==========================================
    // ESSAYS CRUD
    // ==========================================

    @Override
    public Essays createEssay(EssayCreateRequestDto request) {
        return activityProvider.createEssay(request);
    }

    @Override
    public Essays updateEssay(Long id, EssayUpdateRequestDto request) {
        return activityProvider.updateEssay(id, request);
    }

    @Override
    public GenericResponse deleteEssay(Long id) {
        return activityProvider.deleteEssay(id);
    }
}
