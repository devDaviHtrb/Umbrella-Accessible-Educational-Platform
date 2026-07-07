package com.umbrella_api.modules.course.repository;

import java.util.Optional;

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

    @Modifying
    @Query("DELETE FROM CourseUserRelation r WHERE r.user.id = :userId AND r.course.id = :courseId")
    void deleteRelation(@Param("userId") Long userId, @Param("courseId") Long courseId);

}
