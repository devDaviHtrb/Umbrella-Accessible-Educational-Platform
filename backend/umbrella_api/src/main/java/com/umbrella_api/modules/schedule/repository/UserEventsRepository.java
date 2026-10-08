package com.umbrella_api.modules.schedule.repository;

import com.umbrella_api.modules.schedule.model.UserEvents;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserEventsRepository extends JpaRepository<UserEvents, Object> {

    List<UserEvents> findByUserId(Long userId);
    Optional<UserEvents> findByUserIdAndEventId(Long userId, Long eventId);

    @Modifying
    @Query("DELETE FROM UserEvents ue WHERE ue.event.endTime < :now")
    int deleteExpiredUserEvents(@Param("now") LocalDateTime now);

    @Modifying
    @Query("DELETE FROM UserEvents ue WHERE ue.event.id = :eventId")
    void deleteByEventId(@Param("eventId") Long eventId);
}
