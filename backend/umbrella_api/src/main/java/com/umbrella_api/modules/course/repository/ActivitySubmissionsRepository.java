package com.umbrella_api.modules.course.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.umbrella_api.modules.course.model.ActivitySubmissions;

public interface ActivitySubmissionsRepository extends JpaRepository<ActivitySubmissions, Long> {

    List<ActivitySubmissions> findByActivityId(Long activityId);

    List<ActivitySubmissions> findByUserId(Long userId);
}