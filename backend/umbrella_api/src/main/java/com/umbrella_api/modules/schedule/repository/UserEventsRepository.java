package com.umbrella_api.modules.schedule.repository;

import com.umbrella_api.modules.schedule.model.UserEvents;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserEventsRepository extends JpaRepository<UserEvents, Object> {

    List<UserEvents> findByUserId(Long userId);
    Optional<UserEvents> findByUserIdAndEventId(Long userId, Long eventId);
}
