package com.umbrella_api.modules.course.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.umbrella_api.modules.course.model.Courses;

public interface CoursesRepository extends JpaRepository<Courses, Object> {
    @Modifying
    @Query("UPDATE Courses c SET c.subject = null WHERE c.subject.id = :subjectId")
    void nullifySubjectInCourses(@Param("subjectId") Long subjectId);

    List<Courses> findBySubjectId(Long subjectId);
}