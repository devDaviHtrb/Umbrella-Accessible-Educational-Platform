package com.umbrella_api.modules.course.infra;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.course.dto.CourseDto;
import com.umbrella_api.modules.course.dto.CourseGetResponseDto;
import com.umbrella_api.modules.course.dto.ModuleRequestDto;

import com.umbrella_api.modules.course.dto.UpdateModuleDto;
import com.umbrella_api.modules.course.model.CourseUserRelation;
import com.umbrella_api.modules.course.model.Courses;
import com.umbrella_api.modules.course.model.Modules;
import com.umbrella_api.modules.course.model.Subjects;
import com.umbrella_api.modules.course.repository.CourseUserRelationRepository;
import com.umbrella_api.modules.course.repository.CoursesRepository;
import com.umbrella_api.modules.course.repository.ModulesRepository;
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
    private final SubjectsRepository subjectsRepository;
    private final CourseUserRelationRepository courseUserRelationRepository;
    private final StorageService storageService;
    private final UserRepository userRepository;

    public CourseProvider(CoursesRepository coursesRepository, ModulesRepository modulesRepository,
            SubjectsRepository subjectsRepository, CourseUserRelationRepository courseUserRelationRepository,
            StorageService storageService, UserRepository userRepository) {
        this.coursesRepository = coursesRepository;
        this.modulesRepository = modulesRepository;
        this.subjectsRepository = subjectsRepository;
        this.courseUserRelationRepository = courseUserRelationRepository;
        this.storageService = storageService;
        this.userRepository = userRepository;
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

        return new GenericResponse("ok", "Success on delete this relations ", 200);
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

        return new GenericResponse("ok", "Success on create the relationship ", 200);
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

        return new GenericResponse("ok", "Success on delete a course ", 200);
    }

    @Transactional
    public GenericResponse deleteUserRelationsByCourseId(Long id) {

        courseUserRelationRepository.deleteByCourseId(id);

        return new GenericResponse("ok", "Success on delete this relations ", 200);
    }

    @Transactional
    public GenericResponse deleteUserRelationsByUserId(Long id) {
        courseUserRelationRepository.deleteByUserId(id);
        return new GenericResponse("ok", "Success on delete this relations ", 200);
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

        return new GenericResponse("ok", "Success on delete a module ", 200);
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

}
