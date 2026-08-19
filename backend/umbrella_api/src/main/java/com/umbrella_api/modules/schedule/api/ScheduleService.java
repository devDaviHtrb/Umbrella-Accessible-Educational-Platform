package com.umbrella_api.modules.schedule.api;

import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.schedule.dto.EventPostRequestDto;
import com.umbrella_api.modules.schedule.dto.EventPutRequestDto;
import com.umbrella_api.modules.schedule.dto.ScheduleGetRequestDto;
import com.umbrella_api.modules.schedule.model.EventStatus;
import com.umbrella_api.modules.schedule.model.Events;
import com.umbrella_api.modules.schedule.model.UserEvents;

import java.util.List;

public interface ScheduleService {
    public Events createEvent(EventPostRequestDto dto, CustomUserDetails userDetails);
    UserEvents personalizeEvent(Long eventId, CustomUserDetails userDetails, EventStatus status, Integer reminderOffset);
    List<Events> getAllEnrolledCoursesEvents(CustomUserDetails userDetails);
    List<ScheduleGetRequestDto> getAllEvents(CustomUserDetails userDetails);
    void deleteEvent(Long eventId, CustomUserDetails userDetails);
    Events updateEvent(Long eventId, EventPutRequestDto dto, CustomUserDetails userDetails);
}
