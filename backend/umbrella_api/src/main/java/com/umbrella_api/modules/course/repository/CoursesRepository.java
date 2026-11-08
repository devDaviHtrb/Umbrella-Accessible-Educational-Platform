package com.umbrella_api.modules.course.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.umbrella_api.modules.course.model.Courses;

public interface CoursesRepository extends JpaRepository<Courses, Long> {
    @Modifying
    @Query("UPDATE Courses c SET c.subject = null WHERE c.subject.id = :subjectId")
    void nullifySubjectInCourses(@Param("subjectId") Long subjectId);

    List<Courses> findBySubjectId(Long subjectId);

    @Query("SELECT c FROM Courses c WHERE " +
           "(:subjectId IS NULL OR c.subject.id = :subjectId) AND " +
           "(:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Courses> searchCourses(@Param("search") String search, @Param("subjectId") Long subjectId);

    /**
     * Number of enrolled students (relations that are not the course creator)
     * grouped by course id, for a batch of courses. Avoids N+1 counting.
     */
    @Query("SELECT r.course.id, COUNT(r) FROM CourseUserRelation r " +
           "WHERE r.course.id IN :courseIds AND r.creator = false GROUP BY r.course.id")
    List<Object[]> countStudentsByCourseIds(@Param("courseIds") List<Long> courseIds);
}