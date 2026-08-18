package com.umbrella_api.modules.schedule.repository;

import com.umbrella_api.modules.schedule.model.UserEvents;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserEventsRepository extends JpaRepository<UserEvents, Object> {
}
