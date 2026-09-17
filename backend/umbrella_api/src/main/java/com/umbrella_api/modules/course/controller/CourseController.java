package com.umbrella_api.modules.course.controller;

import java.util.List;

import com.umbrella_api.modules.submissions.dto.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.course.api.CourseService;
import com.umbrella_api.modules.course.dto.*;
import com.umbrella_api.modules.course.model.*;
import com.umbrella_api.modules.user.model.UserModel;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/public/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    // ==========================================
    // COURSES
    // ==========================================

    @PostMapping("/register")
    public ResponseEntity<CourseGetResponseDto> registerCourse(
            @RequestBody @Valid CourseDto courseData,
            @AuthenticationPrincipal CustomUserDetails loggedUser) {
        Courses course = courseService.createCourse(courseData, loggedUser);
        return ResponseEntity.ok(CourseGetResponseDto.fromEntity(course));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseResponseDto> getCourseById(@PathVariable Long id) {
        Courses course = courseService.getCourseById(id);
        UserModel creator = courseService.getCourseCreatorById(id);
        return ResponseEntity.ok(CourseResponseDto.fromEntity(course, creator));
    }

    @PreAuthorize("@securityEvaluator.isCourseOwner(#id, principal)")
    @DeleteMapping("/{id}")
    public ResponseEntity<GenericResponse> deleteCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteCourse(id));
    }

    // ==========================================
    // MODULES
    // ==========================================

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @PostMapping("/{courseId}/add_module")
    public ResponseEntity<Modules> addModule(
            @PathVariable Long courseId,
            @RequestBody @Valid ModuleRequestDto moduleData) {
        return ResponseEntity.ok(courseService.createModule(moduleData));
    }

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @PutMapping("/{courseId}/modules/{id}")
    public ResponseEntity<Modules> updateModule(
            @PathVariable Long courseId,
            @PathVariable Long id,
            @RequestBody @Valid UpdateModuleDto moduleData) {
        return ResponseEntity.ok(courseService.updateModule(id, moduleData));
    }

    @GetMapping("/{id}/modules")
    public ResponseEntity<List<ModulesResponseDto>> getModulesByCourse(@PathVariable Long id) {
        List<Modules> modules = courseService.getModulesByCourse(id);
        return ResponseEntity.ok(ModulesResponseDto.fromEntityList(modules));
    }

    @GetMapping("/modules/{id}")
    public ResponseEntity<ModulesResponseDto> getModuleById(@PathVariable Long id) {
        Modules module = courseService.getModuleById(id);
        return ResponseEntity.ok(ModulesResponseDto.fromEntity(module));
    }

    @PreAuthorize("@securityEvaluator.isCourseOwner(#courseId, principal)")
    @DeleteMapping("/{courseId}/modules/{id}")
    public ResponseEntity<GenericResponse> deleteModule(
            @PathVariable Long courseId,
            @PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteModule(id));
    }

    // ==========================================
    // ENROLLMENTS & SUBJECTS
    // ==========================================

    @PostMapping("/{id}/enrrolment/{userId}")
    public ResponseEntity<GenericResponse> createUserRelation(@PathVariable Long id, @PathVariable Long userId) {
        return ResponseEntity.ok(courseService.createUserRelation(userId, id));
    }

    @DeleteMapping("/{id}/enrrolment/{userId}")
    public ResponseEntity<GenericResponse> deleteUserRelation(@PathVariable Long id, @PathVariable Long userId) {
        return ResponseEntity.ok(courseService.deleteUserRelation(userId, id));
    }

    @PostMapping("/subjects/register")
    public ResponseEntity<Subjects> newSubject(@RequestBody String name) {
        return ResponseEntity.ok(courseService.createSubject(name));
    }

    @GetMapping("/subjects")
    public ResponseEntity<List<SubjectsResponseDto>> getSubjects() {
        return ResponseEntity.ok(SubjectsResponseDto.fromEntityList(courseService.getSubjects()));
    }

    @DeleteMapping("/subjects/{id}")
    public ResponseEntity<GenericResponse> deleteSubject(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteSubject(id));
    }

    @GetMapping("/bySubject/{id}")
    public ResponseEntity<List<CourseGetResponseDto>> gerCoursesBySubject(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCoursesBySubject(id));
    }

}