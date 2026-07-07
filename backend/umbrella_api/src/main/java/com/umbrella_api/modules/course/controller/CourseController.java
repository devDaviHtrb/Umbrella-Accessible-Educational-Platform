package com.umbrella_api.modules.course.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.course.api.CourseService;
import com.umbrella_api.modules.course.dto.CourseDto;
import com.umbrella_api.modules.course.dto.CourseGetResponseDto;
import com.umbrella_api.modules.course.dto.CourseResponseDto;
import com.umbrella_api.modules.course.dto.ModuleRequestDto;
import com.umbrella_api.modules.course.dto.ModulesResponseDto;
import com.umbrella_api.modules.course.dto.SubjectsResponseDto;
import com.umbrella_api.modules.course.dto.UpdateModuleDto;
import com.umbrella_api.modules.course.model.Courses;
import com.umbrella_api.modules.course.model.Modules;
import com.umbrella_api.modules.user.model.UserModel;

import jakarta.validation.Valid;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

@RestController
@RequestMapping("/api/public/courses")
public class CourseController {
    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @PostMapping("/register")
    public ResponseEntity<GenericResponse> registerCourse(@RequestBody @Valid CourseDto courseData,
            @AuthenticationPrincipal CustomUserDetails loggedUser) {

        return ResponseEntity.ok(courseService.createCourse(courseData, loggedUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseResponseDto> getCourseById(@PathVariable long id) {
        Courses course = courseService.getCourseById(id);
        UserModel creator = courseService.getCourseCreatorById(id);
        return ResponseEntity.ok(CourseResponseDto.fromEntity(course, creator));
    }

    @PostMapping("/add_module")
    public ResponseEntity<GenericResponse> addModule(@RequestBody @Valid ModuleRequestDto moduleData) {
        return ResponseEntity.ok(courseService.createModule(moduleData));
    }

    @PutMapping("/modules/{id}")
    public ResponseEntity<GenericResponse> updateModule(@PathVariable Long id,
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

    @DeleteMapping("/{id}")
    public ResponseEntity<GenericResponse> deleteCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteCourse(id));
    }

    @DeleteMapping("/modules/{id}")
    public ResponseEntity<GenericResponse> deleteModule(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.deleteModule(id));
    }

    // Create errollment crud
    @PostMapping("/{id}/enrrolment/{userId}")
    public ResponseEntity<GenericResponse> createUserRelation(@PathVariable Long id, @PathVariable Long userId) {
        return ResponseEntity.ok(courseService.createUserRelation(userId, id));
    }

    @DeleteMapping("/{id}/enrrolment/{userId}")
    public ResponseEntity<GenericResponse> deleteUserRelation(@PathVariable Long id, @PathVariable Long userId) {
        return ResponseEntity.ok(courseService.deleteUserRelation(userId, id));
    }

    @PostMapping("/subjects/register")
    public ResponseEntity<GenericResponse> newSubject(@RequestBody String name) {
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
