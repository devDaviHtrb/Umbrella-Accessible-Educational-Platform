package com.umbrella_api.modules.activity.api;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.modules.activity.dto.*;
import com.umbrella_api.modules.activity.model.Activities;
import com.umbrella_api.modules.activity.model.Alternatives;
import com.umbrella_api.modules.activity.model.Essays;
import com.umbrella_api.modules.activity.model.Questions;

import java.util.List;

public interface ActivityService {
    // Activities CRUD
    public Activities createActivity(ActivityCreateRequestDto request);

    public Activities getActivityById(Long id);

    public List<ActivityGetResponseDto> getActivitiesByModuleId(Long moduleId);

    public Activities updateActivity(Long id, ActivityUpdateRequestDto request);

    public GenericResponse deleteActivity(Long id);

    // Questions CRUD
    public Questions createQuestion(QuestionCreateRequestDto request);

    public Questions getQuestionById(Long id);

    public Questions updateQuestion(Long id, QuestionUpdateRequestDto request);

    public GenericResponse deleteQuestion(Long id);

    // Alternatives CRUD
    public Alternatives createAlternative(AlternativeCreateRequestDto request);

    public Alternatives updateAlternative(Long id, AlternativeUpdateRequestDto request);

    public GenericResponse deleteAlternative(Long id);

    public Alternatives getAlternativeById(Long id);

    // Essays CRUD
    public Essays createEssay(EssayCreateRequestDto request);

    public Essays updateEssay(Long id, EssayUpdateRequestDto request);

    public GenericResponse deleteEssay(Long id);
}
