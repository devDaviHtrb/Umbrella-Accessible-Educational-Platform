package com.umbrella_api.modules.schedule.repository;

import com.umbrella_api.modules.schedule.model.Events;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface EventsRepository extends JpaRepository<Events, Object> {
    @Modifying
    @Query("DELETE FROM Events e WHERE e.endTime < :now")
    int deleteExpiredEvents(@Param("now") LocalDateTime now);
}
