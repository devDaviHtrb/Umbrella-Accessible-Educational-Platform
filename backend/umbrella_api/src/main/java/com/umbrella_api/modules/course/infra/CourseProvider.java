package com.umbrella_api.modules.course.infra;

import java.time.Duration;
import java.time.LocalDate;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.modules.course.model.Courses;
import com.umbrella_api.modules.course.model.Modules;
import com.umbrella_api.modules.course.repository.ActivitiesRepository;
import com.umbrella_api.modules.course.repository.CoursesRepository;
import com.umbrella_api.modules.course.repository.ModulesRepository;
import com.umbrella_api.modules.course.repository.QuestionsRepository;
import com.umbrella_api.modules.course.repository.SubjectsRepository;

import jakarta.transaction.Transactional;

public class CourseProvider {
    private final CoursesRepository coursesRepository;
    private final ModulesRepository modulesRepository;
    private final ActivitiesRepository activitiesRepository;
    private final QuestionsRepository questionsRepository;
    private final SubjectsRepository subjectsRepository;

    public CourseProvider(CoursesRepository coursesRepository, ModulesRepository modulesRepository,
            ActivitiesRepository activitiesRepository, QuestionsRepository questionsRepository,
            SubjectsRepository subjectsRepository) {
        this.coursesRepository = coursesRepository;
        this.modulesRepository = modulesRepository;
        this.activitiesRepository = activitiesRepository;
        this.questionsRepository = questionsRepository;
        this.subjectsRepository = subjectsRepository;
    }

    @Transactional
    public GenericResponse createCourse(String name, String description, Integer difficulty_level) {
        try {
            Courses course = Courses.builder().name(name).description(description).difficulty_level(difficulty_level)
                    .module_amount(0).build();
            coursesRepository.save(course);
            return new GenericResponse("ok", "Succes on create " + name, 200);
        } catch (Exception e) {
            e.printStackTrace();
            org.springframework.transaction.interceptor.TransactionAspectSupport
                    .currentTransactionStatus().setRollbackOnly();
            return new GenericResponse("Error", "Error create " + name, 400);
        }
    }

    @Transactional
    public GenericResponse deleteCourse(long id) {
        try {
            coursesRepository.deleteById(id);
        } catch (Exception e) {
            e.printStackTrace();
            org.springframework.transaction.interceptor.TransactionAspectSupport
                    .currentTransactionStatus().setRollbackOnly();
            return new GenericResponse("Error", "Error delete the course ", 400);
        }
        return new GenericResponse("ok", "Succes on delete a course ", 200);
    }

    @Transactional
    public GenericResponse createModule(String name, String description, boolean isRequired, LocalDate creationDate,
            Duration timeLimit) {
        try {
            Modules module = Modules.builder().name(name).description(description).creation_date(creationDate)
                    .required(isRequired).time_limit(timeLimit).build();
            modulesRepository.save(module);
            return new GenericResponse("ok", "Succes on create " + name, 200);
        } catch (Exception e) {
            e.printStackTrace();
            org.springframework.transaction.interceptor.TransactionAspectSupport
                    .currentTransactionStatus().setRollbackOnly();
            return new GenericResponse("Error", "Error create " + name, 400);
        }
    }

    @Transactional
    public GenericResponse deleteModule(long id) {
        try {
            modulesRepository.deleteById(id);
        } catch (Exception e) {
            e.printStackTrace();
            org.springframework.transaction.interceptor.TransactionAspectSupport
                    .currentTransactionStatus().setRollbackOnly();
            return new GenericResponse("Error", "Error delete the module ", 400);
        }
        return new GenericResponse("ok", "Succes on delete a module ", 200);
    }

}
