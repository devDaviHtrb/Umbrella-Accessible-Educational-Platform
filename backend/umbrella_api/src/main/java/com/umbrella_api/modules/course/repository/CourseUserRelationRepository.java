package com.umbrella_api.modules.course.repository;

import java.util.List;
import java.util.Optional;

import com.umbrella_api.modules.course.model.Courses;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.umbrella_api.modules.course.model.CourseUserRelation;
import com.umbrella_api.modules.user.model.UserModel;

public interface CourseUserRelationRepository extends JpaRepository<CourseUserRelation, Object> {
    @Query("SELECT r.user FROM CourseUserRelation r WHERE r.course.id = :courseId AND r.creator = true")
    public Optional<UserModel> findCreatorByCourseId(@Param("courseId") Long courseId);

    public void deleteByCourseId(Long courseId);

    public void deleteByUserId(Long UserId);

    @Query("SELECT r.course FROM CourseUserRelation r WHERE r.user.id = :userId AND r.creator = false")
    List<Courses> findCoursesByUserIdAndNotCreator(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM CourseUserRelation r WHERE r.user.id = :userId AND r.course.id = :courseId")
    void deleteRelation(@Param("userId") Long userId, @Param("courseId") Long courseId);

}
