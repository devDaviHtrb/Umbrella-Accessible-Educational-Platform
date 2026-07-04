package com.umbrella_api.modules.course.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.umbrella_api.modules.course.model.Courses;

public interface CoursesRepository extends JpaRepository<Courses, Object> {
}