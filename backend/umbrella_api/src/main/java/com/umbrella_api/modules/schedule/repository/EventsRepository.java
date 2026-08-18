package com.umbrella_api.modules.schedule.repository;

import com.umbrella_api.modules.schedule.model.Events;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventsRepository extends JpaRepository<Events, Object> {
}
