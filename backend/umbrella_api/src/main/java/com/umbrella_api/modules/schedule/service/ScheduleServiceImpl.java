package com.umbrella_api.modules.schedule.service;

import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.schedule.api.ScheduleService;
import com.umbrella_api.modules.schedule.dto.EventPostRequestDto;
import com.umbrella_api.modules.schedule.dto.EventPutRequestDto;
import com.umbrella_api.modules.schedule.dto.ScheduleGetRequestDto;
import com.umbrella_api.modules.schedule.infra.ScheduleProvider;
import com.umbrella_api.modules.schedule.model.EventStatus;
import com.umbrella_api.modules.schedule.model.Events;
import com.umbrella_api.modules.schedule.model.UserEvents;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ScheduleServiceImpl implements ScheduleService {
    private final ScheduleProvider scheduleProvider;

    public ScheduleServiceImpl(ScheduleProvider scheduleProvider) {
        this.scheduleProvider = scheduleProvider;
    }

    @Override
    public Events createEvent(EventPostRequestDto dto, CustomUserDetails userDetails) {
        return scheduleProvider.createEvent(dto, userDetails);
    }

    @Override
    public UserEvents personalizeEvent(Long eventId, CustomUserDetails userDetails, EventStatus status, Integer reminderOffset) {
        return scheduleProvider.personalizeEvent(eventId, userDetails, status, reminderOffset);
    }

    @Override
    public List<Events> getAllEnrolledCoursesEvents(CustomUserDetails userDetails) {
        return scheduleProvider.getAllEnrolledCoursesEvents(userDetails);
    }

    @Override
    public List<ScheduleGetRequestDto> getAllEvents(CustomUserDetails userDetails) {
        return scheduleProvider.getAllEvents(userDetails);
    }

    @Override
    public void deleteEvent(Long eventId, CustomUserDetails userDetails) {
        scheduleProvider.deleteEvent(eventId, userDetails);
    }

    @Override
    public Events updateEvent(Long eventId, EventPutRequestDto dto, CustomUserDetails userDetails) {
        return scheduleProvider.updateEvent(eventId, dto, userDetails);
    }
}
