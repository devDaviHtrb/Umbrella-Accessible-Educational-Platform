package com.umbrella_api.modules.course.infra;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.umbrella_api.modules.schedule.api.ScheduleService;
import org.springframework.stereotype.Component;

import com.umbrella_api.common.Exceptions.FileStorageException;
import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.course.dto.ActivityCreateRequestDto;
import com.umbrella_api.modules.course.dto.ActivityGetResponseDto;
import com.umbrella_api.modules.course.dto.ActivitySubmissionResponseDto;
import com.umbrella_api.modules.course.dto.ActivitySubmissionUpdateRequestDto;
import com.umbrella_api.modules.course.dto.ActivityUpdateRequestDto;
import com.umbrella_api.modules.course.dto.AlternativeCreateRequestDto;
import com.umbrella_api.modules.course.dto.AlternativeUpdateRequestDto;
import com.umbrella_api.modules.course.dto.CourseDto;
import com.umbrella_api.modules.course.dto.CourseGetResponseDto;
import com.umbrella_api.modules.course.dto.EssayCreateRequestDto;
import com.umbrella_api.modules.course.dto.EssayUpdateRequestDto;
import com.umbrella_api.modules.course.dto.ModuleRequestDto;
import com.umbrella_api.modules.course.dto.QuestionCreateRequestDto;
import com.umbrella_api.modules.course.dto.QuestionGetResponseDto;
import com.umbrella_api.modules.course.dto.QuestionUpdateRequestDto;
import com.umbrella_api.modules.course.dto.StudentAnswerCorrectionDto;

import com.umbrella_api.modules.course.dto.StudentAnswerResponseDto;
import com.umbrella_api.modules.course.dto.StudentAnswerUpdateRequestDto;
import com.umbrella_api.modules.course.dto.SubmitActivityRequestDto;
import com.umbrella_api.modules.course.dto.UpdateModuleDto;
import com.umbrella_api.modules.course.model.Activities;
import com.umbrella_api.modules.course.model.ActivitySubmissions;
import com.umbrella_api.modules.course.model.Alternatives;
import com.umbrella_api.modules.course.model.CourseUserRelation;
import com.umbrella_api.modules.course.model.Courses;
import com.umbrella_api.modules.course.model.Essays;
import com.umbrella_api.modules.course.model.Modules;
import com.umbrella_api.modules.course.model.Questions;
import com.umbrella_api.modules.course.model.StudentAnswers;
import com.umbrella_api.modules.course.model.Subjects;
import com.umbrella_api.modules.course.repository.ActivitiesRepository;
import com.umbrella_api.modules.course.repository.ActivitySubmissionsRepository;
import com.umbrella_api.modules.course.repository.AlternativesRepository;
import com.umbrella_api.modules.course.repository.CourseUserRelationRepository;
import com.umbrella_api.modules.course.repository.CoursesRepository;
import com.umbrella_api.modules.course.repository.EssaysRepository;
import com.umbrella_api.modules.course.repository.ModulesRepository;
import com.umbrella_api.modules.course.repository.QuestionsRepository;
import com.umbrella_api.modules.course.repository.StudentAnswersRepository;
import com.umbrella_api.modules.course.repository.SubjectsRepository;
import com.umbrella_api.modules.storage.api.StorageService;
import com.umbrella_api.modules.user.model.UserModel;
import com.umbrella_api.modules.user.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;

@Component
public class CourseProvider {
    private final CoursesRepository coursesRepository;
    private final ModulesRepository modulesRepository;
    private final ActivitiesRepository activitiesRepository;
    private final QuestionsRepository questionsRepository;
    private final SubjectsRepository subjectsRepository;
    private final CourseUserRelationRepository courseUserRelationRepository;
    private final StorageService storageService;
    private final UserRepository userRepository;
    private final AlternativesRepository alternativesRepository;
    private final EssaysRepository essaysRepository;
    private final ActivitySubmissionsRepository activitySubmissionsRepository;
    private final StudentAnswersRepository studentAnswersRepository;

    public CourseProvider(CoursesRepository coursesRepository, ModulesRepository modulesRepository,
            ActivitiesRepository activitiesRepository, QuestionsRepository questionsRepository,
            SubjectsRepository subjectsRepository, CourseUserRelationRepository courseUserRelationRepository,
            StorageService storageService, UserRepository userRepository, AlternativesRepository alternativesRepository,
            EssaysRepository essaysRepository, ActivitySubmissionsRepository activitySubmissionsRepository,
            StudentAnswersRepository studentAnswersRepository) {
        this.coursesRepository = coursesRepository;
        this.modulesRepository = modulesRepository;
        this.activitiesRepository = activitiesRepository;
        this.questionsRepository = questionsRepository;
        this.subjectsRepository = subjectsRepository;
        this.courseUserRelationRepository = courseUserRelationRepository;
        this.storageService = storageService;
        this.userRepository = userRepository;
        this.alternativesRepository = alternativesRepository;
        this.essaysRepository = essaysRepository;
        this.activitySubmissionsRepository = activitySubmissionsRepository;
        this.studentAnswersRepository = studentAnswersRepository;

    }

    @Transactional
    public Courses createCourse(CourseDto courseData, CustomUserDetails loggedUser) {

        Subjects subject = null;
        if (courseData.subjectId() != null) {
            Optional<Subjects> subjectOptional = subjectsRepository.findById(courseData.subjectId());

            if (subjectOptional.isEmpty()) {
                throw new EntityNotFoundException("The selected subject doesn't exists or not found");
            }

            subject = subjectOptional.get();
        }

        Courses course = Courses.builder().name(courseData.name()).description(courseData.description())
                .difficulty_level(courseData.difficulty_level())
                .module_amount(0).subject(subject).build();
        UserModel user = userRepository.getReferenceById(loggedUser.getUserModel().getId());
        coursesRepository.save(course);

        CourseUserRelation relation = CourseUserRelation.builder().course(course).user(user).creator(true).build();
        courseUserRelationRepository.save(relation);

        return course;

    }

    @Transactional
    public GenericResponse deleteUserRelation(Long userId, Long courseId) {

        courseUserRelationRepository.deleteRelation(userId, courseId);

        return new GenericResponse("ok", "Succes on delete this relations ", 200);
    }

    @Transactional
    public GenericResponse createUserRelation(Long userId, Long courseId) {

        Optional<UserModel> userOptional = userRepository.findById(userId);
        Optional<Courses> courseOptional = coursesRepository.findById(courseId);

        if (courseOptional.isEmpty() || userOptional.isEmpty()) {
            return new GenericResponse("Error", "User or course not found", 404);
        }

        UserModel user = userOptional.get();
        Courses course = courseOptional.get();
        CourseUserRelation relation = CourseUserRelation.builder().user(user).course(course).build();
        courseUserRelationRepository.save(relation);

        return new GenericResponse("ok", "Succes on create the relationship ", 200);
    }

    public List<Courses> getEnrolledCoursesByUser(CustomUserDetails userDetails) {
        UserModel user = userDetails.getUserModel();
        return courseUserRelationRepository.findCoursesByUserIdAndNotCreator(user.getId());
    }

    @Transactional
    public GenericResponse deleteCourse(long id) {

        this.deleteAllModulesByCourseId(id);
        this.deleteUserRelationsByCourseId(id);
        coursesRepository.deleteById(id);

        return new GenericResponse("ok", "Succes on delete a course ", 200);
    }

    @Transactional
    public GenericResponse deleteUserRelationsByCourseId(Long id) {

        courseUserRelationRepository.deleteByCourseId(id);

        return new GenericResponse("ok", "Succes on delete this relations ", 200);
    }

    @Transactional
    public GenericResponse deleteUserRelationsByUserId(Long id) {
        courseUserRelationRepository.deleteByUserId(id);
        return new GenericResponse("ok", "Succes on delete this relations ", 200);
    }

    @Transactional
    public Modules createModule(ModuleRequestDto moduleData) {

        // add a user validation after
        Optional<Courses> courseOptional = coursesRepository.findById(moduleData.courseId());
        if (courseOptional.isEmpty()) {
            throw new EntityNotFoundException("This course doesn't exist or not found");
        }
        Courses course = courseOptional.get();

        Modules module = Modules.builder().name(moduleData.name()).description(moduleData.description())
                .creation_date(moduleData.creationDate())
                .required(moduleData.isRequired()).time_limit(moduleData.timeLimit())
                .course(course).build();
        modulesRepository.save(module);

        course.setModule_amount(course.getModule_amount() + 1);
        coursesRepository.save(course);

        return module;

    }

    @Transactional
    public GenericResponse deleteModule(long id) {

        Optional<Modules> opModule = this.getModuleById(id);

        if (opModule.isEmpty()) {
            return new GenericResponse("Error", "Module not found", 404);
        }

        Modules module = opModule.get();
        Courses course = this.getCourseById(module.getCourse().getId()).get();
        storageService.deleteAllFilesByModuleId(module.getId());

        modulesRepository.deleteById(id);
        course.setModule_amount(course.getModule_amount() - 1);

        coursesRepository.save(course);

        return new GenericResponse("ok", "Succes on delete a module ", 200);
    }

    public List<Modules> getModulesByCourse(Long courseId) {
        return modulesRepository.findByCourseId(courseId);
    }

    public Optional<Modules> getModuleById(Long moduleId) {
        return modulesRepository.findById(moduleId);
    }

    @Transactional
    public Modules updateModule(Long id, UpdateModuleDto moduleData) {
        Optional<Modules> moduleOptional = modulesRepository.findById(id);

        if (moduleOptional.isEmpty()) {
            throw new EntityNotFoundException("Module doesn't exist or not found");
        }

        Modules module = moduleOptional.get();

        module.setName(moduleData.name());
        module.setDescription(moduleData.description());
        module.setRequired(moduleData.isRequired());
        module.setTime_limit(moduleData.timeLimit());

        modulesRepository.save(module);

        return module;
    }

    @Transactional
    public Courses updateCourse(Long id, CourseDto courseData) {
        Optional<Courses> courseOptional = coursesRepository.findById(id);

        if (courseOptional.isEmpty()) {
            throw new EntityNotFoundException("Course not found");
        }

        Courses course = courseOptional.get();

        if (courseData.subjectId() != null) {
            Optional<Subjects> subjecOptional = subjectsRepository.findById(courseData.subjectId());
            if (subjecOptional.isEmpty()) {
                throw new EntityNotFoundException("Subject not found");
            }
            course.setSubject(subjecOptional.get());
        }

        course.setName(courseData.name());
        course.setDescription(courseData.description());
        course.setDifficulty_level(courseData.difficulty_level());

        coursesRepository.save(course);

        return course;
    }

    public Optional<Courses> getCourseById(Long id) {
        return coursesRepository.findById(id);
    }

    public UserModel getCourseCreator(Long courseId) {
        return courseUserRelationRepository.findCreatorByCourseId(courseId).orElse(null);
    }

    @Transactional
    public void deleteAllModulesByCourseId(Long courseId) {
        List<Modules> modules = modulesRepository.findByCourseId(courseId);

        for (Modules module : modules) {
            storageService.deleteAllFilesByModuleId(module.getId());
            modulesRepository.deleteById(module.getId());
        }
    }

    @Transactional
    public Subjects createSubject(String subjectName) {
        Subjects subject = Subjects.builder().subject(subjectName).build();
        subjectsRepository.save(subject);
        return subject;
    }

    public List<Subjects> getSubjects() {
        return subjectsRepository.findAll();
    }

    @Transactional
    public GenericResponse deleteSubject(Long subjectId) {

        if (!subjectsRepository.existsById(subjectId)) {
            return new GenericResponse("Error", "Subject not found", 404);
        }

        coursesRepository.nullifySubjectInCourses(subjectId);

        subjectsRepository.deleteById(subjectId);

        return new GenericResponse("ok", "Subject deleted and associated courses unlinked successfully", 200);

    }

    public List<CourseGetResponseDto> getCoursesBySubject(Long subjectId) {

        List<Courses> courses = coursesRepository.findBySubjectId(subjectId);
        return CourseGetResponseDto.fromEntityList(courses);
    }

    // ==========================================
    // ACTIVITIES CRUD
    // ==========================================

    @Transactional
    public Activities createActivity(ActivityCreateRequestDto request) {
        Optional<Modules> moduleOpt = modulesRepository.findById(request.moduleId());
        if (moduleOpt.isEmpty()) {
            throw new EntityNotFoundException("Module not found");
        }

        Activities activity = Activities.builder()
                .title(request.title())
                .test(request.test())
                .maxScore(request.maxScore())
                .status(request.status() != null ? request.status() : "awaiting the data dict")
                .module(moduleOpt.get())
                .build();

        activitiesRepository.save(activity);
        return activity;
    }

    public ActivityGetResponseDto getActivityById(Long id) {
        return activitiesRepository.findById(id)
                .map(ActivityGetResponseDto::fromEntity)
                .orElse(null);
    }

    public List<ActivityGetResponseDto> getActivitiesByModuleId(Long moduleId) {
        List<Activities> activities = activitiesRepository.findByModuleId(moduleId);
        return ActivityGetResponseDto.fromEntityList(activities);
    }

    @Transactional
    public Activities updateActivity(Long id, ActivityUpdateRequestDto request) {

        Optional<Activities> activityOpt = activitiesRepository.findById(id);
        if (activityOpt.isEmpty()) {
            throw new EntityNotFoundException("Activity not found");
        }

        Activities activity = activityOpt.get();

        if (request.title() != null)
            activity.setTitle(request.title());
        if (request.test() != null)
            activity.setTest(request.test());
        if (request.maxScore() != null)
            activity.setMaxScore(request.maxScore());
        if (request.status() != null)
            activity.setStatus(request.status());

        if (request.moduleId() != null) {
            Optional<Modules> moduleOpt = modulesRepository.findById(request.moduleId());
            if (moduleOpt.isEmpty()) {
                throw new EntityNotFoundException("Module not found");
            }
            activity.setModule(moduleOpt.get());
        }

        activitiesRepository.save(activity);
        return activity;

    }

    @Transactional
    public GenericResponse deleteActivity(Long id) {

        Optional<Activities> activityOpt = activitiesRepository.findById(id);
        if (activityOpt.isEmpty()) {
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

        Optional<Activities> activityOpt = activitiesRepository.findById(request.activityId());
        if (activityOpt.isEmpty()) {
            throw new EntityNotFoundException("Activity not found");
        }

        Questions question = Questions.builder()
                .points(request.points())
                .status(request.status() != null ? request.status() : "awaiting the data dict")
                .number(request.number())
                .statement(request.statement())
                .activity(activityOpt.get())
                .build();

        questionsRepository.save(question);
        return question;

    }

    public QuestionGetResponseDto getQuestionById(Long id) {
        return questionsRepository.findById(id)
                .map(QuestionGetResponseDto::fromEntity)
                .orElse(null);
    }

    @Transactional
    public Questions updateQuestion(Long id, QuestionUpdateRequestDto request) {

        Optional<Questions> questionOpt = questionsRepository.findById(id);
        if (questionOpt.isEmpty()) {
            throw new EntityNotFoundException("Question not found");
        }

        Questions question = questionOpt.get();

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
            return new GenericResponse("Error", "Question not found", 404);
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

        Optional<Questions> questionOpt = questionsRepository.findById(request.questionId());
        if (questionOpt.isEmpty()) {
            throw new EntityNotFoundException("Question not found");
        }

        Alternatives alternative = Alternatives.builder()
                .correct(request.correct())
                .letter(request.letter())
                .text(request.text())
                .question(questionOpt.get())
                .build();

        alternativesRepository.save(alternative);
        return alternative;

    }

    @Transactional
    public Alternatives updateAlternative(Long id, AlternativeUpdateRequestDto request) {
        Optional<Alternatives> altOpt = alternativesRepository.findById(id);
        if (altOpt.isEmpty()) {
            throw new EntityNotFoundException("Alternative not found");
        }

        Alternatives alternative = altOpt.get();

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
            return new GenericResponse("Error", "Alternative not found", 404);
        }

        alternativesRepository.deleteById(id);
        return new GenericResponse("ok", "Success on delete alternative", 200);

    }

    // ==========================================
    // ESSAYS CRUD
    // ==========================================

    @Transactional
    public Essays createEssay(EssayCreateRequestDto request) {

        Optional<Questions> questionOpt = questionsRepository.findById(request.questionId());
        if (questionOpt.isEmpty()) {
            throw new EntityNotFoundException("Question not found");
        }

        Essays essay = Essays.builder()
                .expectedAnswer(request.expectedAnswer())
                .minLetters(request.minLetters())
                .maxLetters(request.maxLetters())
                .question(questionOpt.get())
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
            return new GenericResponse("Error", "Essay criteria not found", 404);
        }

        essaysRepository.deleteById(id);
        return new GenericResponse("ok", "Success on delete essay criteria", 200);

    }
    // ==========================================
    // ACTIVITY SUBMISSIONS CRUD
    // ==========================================

    @Transactional
    public ActivitySubmissions createActivitySubmission(Long activityId,
            CustomUserDetails userDetails) {
        UserModel user = userDetails.getUserModel();

        Optional<Activities> activityOpt = activitiesRepository.findById(activityId);
        if (activityOpt.isEmpty()) {
            throw new EntityNotFoundException("Activity not found");
        }

        ActivitySubmissions submission = ActivitySubmissions.builder()
                .user(user)
                .activity(activityOpt.get())
                .score(0f)
                .status("IN_PROGRESS")
                .submittedAt(LocalDateTime.now())
                .build();

        activitySubmissionsRepository.save(submission);
        return submission;
    }

    public ActivitySubmissionResponseDto getActivitySubmissionById(Long id) {
        return activitySubmissionsRepository.findById(id)
                .map(ActivitySubmissionResponseDto::fromEntity)
                .orElse(null);
    }

    public List<ActivitySubmissionResponseDto> getSubmissionsByActivityId(Long activityId) {
        List<ActivitySubmissions> list = activitySubmissionsRepository.findByActivityId(activityId);
        return ActivitySubmissionResponseDto.fromEntityList(list);
    }

    public List<ActivitySubmissionResponseDto> getSubmissionsByUserId(Long userId) {
        List<ActivitySubmissions> list = activitySubmissionsRepository.findByUserId(userId);
        return ActivitySubmissionResponseDto.fromEntityList(list);
    }

    @Transactional
    public GenericResponse updateActivitySubmission(Long id, ActivitySubmissionUpdateRequestDto request) {
        Optional<ActivitySubmissions> submissionOpt = activitySubmissionsRepository.findById(id);
        if (submissionOpt.isEmpty()) {
            return new GenericResponse("Error", "Activity submission not found", 404);
        }

        ActivitySubmissions submission = submissionOpt.get();

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
            return new GenericResponse("Error", "Activity submission not found", 404);
        }
        studentAnswersRepository.deleteBySubmissionId(id);

        activitySubmissionsRepository.deleteById(id);
        return new GenericResponse("ok", "Success on delete activity submission", 200);

    }

    // ==========================================
    // STUDENT ANSWERS CRUD
    // ==========================================

    public StudentAnswerResponseDto getStudentAnswerById(Long id) {
        return studentAnswersRepository.findById(id)
                .map(StudentAnswerResponseDto::fromEntity)
                .orElse(null);
    }

    public List<StudentAnswerResponseDto> getAnswersBySubmissionId(Long submissionId) {
        List<StudentAnswers> answers = studentAnswersRepository.findBySubmissionId(submissionId);
        return answers.stream()
                .map(StudentAnswerResponseDto::fromEntity)
                .toList();
    }

    @Transactional
    public StudentAnswerResponseDto updateStudentAnswer(Long id, StudentAnswerUpdateRequestDto request) {

        Optional<StudentAnswers> answerOpt = studentAnswersRepository.findById(id);
        if (answerOpt.isEmpty()) {
            throw new EntityNotFoundException("Answer not found");
        }

        StudentAnswers answer = answerOpt.get();

        if (request.chosenAlternativeId() != null) {
            Optional<Alternatives> altOpt = alternativesRepository.findById(request.chosenAlternativeId());
            if (altOpt.isEmpty()) {
                throw new EntityNotFoundException("Alternative not found");
            }
            answer.setChosenAlternative(altOpt.get());
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
            return new GenericResponse("Error", "Student answer not found", 404);
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
            Questions question = questionsRepository.findById(answerDto.questionId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Question not found with ID: " + answerDto.questionId()));

            Alternatives chosenAlternative = null;
            Boolean isCorrect = null;

            if (answerDto.chosenAlternativeId() != null) {
                chosenAlternative = alternativesRepository.findById(answerDto.chosenAlternativeId())
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Alternative not found with ID: " + answerDto.chosenAlternativeId()));

                if (chosenAlternative.isCorrect()) {
                    isCorrect = true;
                    if (question.getPoints() != null) {
                        totalScore += question.getPoints();
                    }
                } else {
                    isCorrect = false;
                }
            }

            StudentAnswers studentAnswer = StudentAnswers.builder()
                    .submission(submission)
                    .question(question)
                    .chosenAlternative(chosenAlternative)
                    .essayAnswer(answerDto.essayAnswer())
                    .isCorrect(isCorrect)
                    .build();

            studentAnswersRepository.save(studentAnswer);
        }

        submission.setScore(totalScore);
        activitySubmissionsRepository.save(submission);

        return ActivitySubmissionResponseDto.fromEntity(submission);

    }

}
