package com.umbrella_api.modules.course.infra;

import java.util.List;
import java.util.Optional;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.course.dto.CourseDto;
import com.umbrella_api.modules.course.dto.ModuleDto;
import com.umbrella_api.modules.course.dto.UpdateModuleDto;
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
    public GenericResponse createCourse(CourseDto courseData, CustomUserDetails loggedUser) {
        try {
            Courses course = Courses.builder().name(courseData.name()).description(courseData.description())
                    .difficulty_level(courseData.difficulty_level())
                    .module_amount(0).build();
            coursesRepository.save(course);
            return new GenericResponse("ok", "Succes on create " + courseData.name(), 200);
        } catch (Exception e) {
            e.printStackTrace();
            org.springframework.transaction.interceptor.TransactionAspectSupport
                    .currentTransactionStatus().setRollbackOnly();
            return new GenericResponse("Error", "Error create " + courseData.name(), 400);
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
    public GenericResponse createModule(ModuleDto moduleData) {
        try {

            // add a user validation after
            Optional<Courses> courseOptional = coursesRepository.findById(moduleData.courseId());
            if (courseOptional.isEmpty()) {
                return new GenericResponse("Error", "Course not found.", 404);
            }

            Modules module = Modules.builder().name(moduleData.name()).description(moduleData.description())
                    .creation_date(moduleData.creationDate())
                    .required(moduleData.isRequired()).time_limit(moduleData.timeLimit())
                    .courseId(moduleData.courseId()).build();
            modulesRepository.save(module);

            Courses course = courseOptional.get();
            course.setModule_amount(course.getModule_amount() + 1);
            coursesRepository.save(course);

            return new GenericResponse("ok", "Succes on create " + moduleData.name(), 200);

        } catch (Exception e) {

            e.printStackTrace();
            org.springframework.transaction.interceptor.TransactionAspectSupport
                    .currentTransactionStatus().setRollbackOnly();

            return new GenericResponse("Error", "Error create " + moduleData.name(), 400);

        }
    }

    @Transactional
    public GenericResponse deleteModule(long id) {
        try {
            Optional<Modules> opModule = this.getModuleById(id);

            if (opModule.isEmpty()) {
                return new GenericResponse("Error", "Module not found", 404);
            }

            Modules module = opModule.get();
            Courses course = this.getCourseById(module.getCourseId()).get();

            modulesRepository.deleteById(id);
            course.setModule_amount(course.getModule_amount() - 1);

            coursesRepository.save(course);

        } catch (Exception e) {
            e.printStackTrace();
            org.springframework.transaction.interceptor.TransactionAspectSupport
                    .currentTransactionStatus().setRollbackOnly();
            return new GenericResponse("Error", "Error delete the module ", 400);
        }
        return new GenericResponse("ok", "Succes on delete a module ", 200);
    }

    public List<Modules> getModulesByCourse(Long courseId) {
        return modulesRepository.findByCourseId(courseId);
    }

    public Optional<Modules> getModuleById(Long moduleId) {
        return modulesRepository.findById(moduleId);
    }

    @Transactional
    public GenericResponse updateModule(Long id, UpdateModuleDto moduleData) {
        try {
            Optional<Modules> moduleOptional = modulesRepository.findById(id);

            if (moduleOptional.isEmpty()) {
                return new GenericResponse("Not Found", "Module not found", 404);
            }

            Modules module = moduleOptional.get();

            module.setName(moduleData.name());
            module.setDescription(moduleData.description());
            module.setRequired(moduleData.isRequired());
            module.setTime_limit(moduleData.timeLimit());

            modulesRepository.save(module);

            return new GenericResponse("ok", "Succes on update this module", 200);
        } catch (Exception e) {
            e.printStackTrace();
            org.springframework.transaction.interceptor.TransactionAspectSupport
                    .currentTransactionStatus().setRollbackOnly();
            return new GenericResponse("Error", "Error on update this module ", 400);
        }
    }

    @Transactional
    public GenericResponse updateCourse(Long id, CourseDto courseData) {
        try {
            Optional<Courses> courseOptional = coursesRepository.findById(id);

            if (courseOptional.isEmpty()) {
                return new GenericResponse("Not Found", "Course not found", 404);
            }

            Courses course = courseOptional.get();

            course.setName(courseData.name());
            course.setDescription(courseData.description());
            course.setDifficulty_level(courseData.difficulty_level());

            coursesRepository.save(course);

            return new GenericResponse("ok", "Succes on update this course", 200);
        } catch (Exception e) {
            e.printStackTrace();
            org.springframework.transaction.interceptor.TransactionAspectSupport
                    .currentTransactionStatus().setRollbackOnly();
            return new GenericResponse("Error", "Error on update this course ", 400);
        }
    }

    public Optional<Courses> getCourseById(Long id) {
        return coursesRepository.findById(id);
    }

}
