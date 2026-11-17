package com.umbrella_api.modules.submissions.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.umbrella_api.modules.submissions.model.ActivitySubmissions;

public interface ActivitySubmissionsRepository extends JpaRepository<ActivitySubmissions, Long> {

    @Query("SELECT s FROM ActivitySubmissions s JOIN FETCH s.user WHERE s.activity.id = :activityId")
    List<ActivitySubmissions> findByActivityId(@Param("activityId") Long activityId);

    @Query("SELECT s FROM ActivitySubmissions s JOIN FETCH s.user WHERE s.user.id = :userId")
    List<ActivitySubmissions> findByUserId(@Param("userId") Long userId);

    @Query("SELECT s FROM ActivitySubmissions s JOIN FETCH s.user WHERE s.id = :id")
    Optional<ActivitySubmissions> findByIdWithUser(@Param("id") Long id);
}
