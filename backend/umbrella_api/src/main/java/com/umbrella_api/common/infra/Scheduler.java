package com.umbrella_api.common.infra;

import com.umbrella_api.modules.schedule.repository.EventsRepository;
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

    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanExpiredEvents() {
        LocalDateTime now = LocalDateTime.now();
        int deletedCount = eventsRepository.deleteExpiredEvents(now);
        log.info("Schedule clean was completed: {} expired event were removed.", deletedCount);
    }
}
