package com.umbrella_api.common.infra;

import com.umbrella_api.modules.schedule.repository.EventsRepository;
import com.umbrella_api.modules.schedule.repository.UserEventsRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class Scheduler {
    private final EventsRepository eventsRepository;
    private final UserEventsRepository userEventsRepository;

    @Scheduled(cron = "0 * * * * ?")
    @Transactional
    public void cleanExpiredEvents() {
        LocalDateTime now = LocalDateTime.now();
        int deletedUserEvents = userEventsRepository.deleteExpiredUserEvents(now);
        int deletedCount = eventsRepository.deleteExpiredEvents(now);
        if (deletedCount > 0 || deletedUserEvents > 0) {
            log.info("Schedule clean was completed: {} user events and {} events were removed.", deletedUserEvents,
                    deletedCount);
        }
    }
}
