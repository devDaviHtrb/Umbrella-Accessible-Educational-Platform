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
        Subjects subject = this.getSubjectbyId(courseData.subjectId());

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
    public Courses getCourseByid(Long id){
        return coursesRepository.findById(id).orElseThrow(()-> new EntityNotFoundException("Course not found"));
    }

    @Transactional
    public GenericResponse deleteUserRelation(Long userId, Long courseId) {

        courseUserRelationRepository.deleteRelation(userId, courseId);

        return new GenericResponse("ok", "Success on delete this relations ", 200);
    }

    @Transactional
    public GenericResponse createUserRelation(Long userId, Long courseId) {

        UserModel user =  userRepository.findById(userId).orElseThrow(()->new EntityNotFoundException("User not found"));
        Courses course = this.getCourseByid(courseId);
        CourseUserRelation relation = CourseUserRelation.builder().user(user).course(course).build();
        courseUserRelationRepository.save(relation);

        return new GenericResponse("ok", "Success on create the relationship ", 200);
    }

    public List<Courses> getEnrolledCoursesByUser(CustomUserDetails userDetails) {
        UserModel user = userRepository.getReferenceById(userDetails.getUserModel().getId());
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
        Courses course = this.getCourseByid(moduleData.courseId());

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
        Modules module = this.getModuleById(id);
        Courses course = module.getCourse();
        storageService.deleteAllFilesByModuleId(module.getId());

        modulesRepository.deleteById(id);
        course.setModule_amount(course.getModule_amount() - 1);

        coursesRepository.save(course);

        return new GenericResponse("ok", "Success on delete a module ", 200);
    }

    public List<Modules> getModulesByCourse(Long courseId) {
        return modulesRepository.findByCourseId(courseId);
    }

    public Modules getModuleById(Long moduleId) {
        return modulesRepository.findById(moduleId).orElseThrow(()->new EntityNotFoundException("Module not Found"));
    }

    @Transactional
    public Modules updateModule(Long id, UpdateModuleDto moduleData) {
        Modules module = this.getModuleById(id);

        module.setName(moduleData.name());
        module.setDescription(moduleData.description());
        module.setRequired(moduleData.isRequired());
        module.setTime_limit(moduleData.timeLimit());

        modulesRepository.save(module);

        return module;
    }

    @Transactional
    public Courses updateCourse(Long id, CourseDto courseData) {
        Courses course = this.getCourseByid(id);

        if (courseData.subjectId() != null) {
            course.setSubject(this.getSubjectbyId(courseData.subjectId()));
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

    public Subjects getSubjectbyId(Long id){
        return subjectsRepository.findById(id).orElseThrow(()-> new EntityNotFoundException("Subject not Found"));
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
