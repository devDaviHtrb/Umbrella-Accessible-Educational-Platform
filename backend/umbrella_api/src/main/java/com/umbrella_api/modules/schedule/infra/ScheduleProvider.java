package com.umbrella_api.modules.schedule.infra;

import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.course.api.CourseService;
import com.umbrella_api.modules.course.model.Courses;
import com.umbrella_api.modules.schedule.dto.EventPostRequestDto;
import com.umbrella_api.modules.schedule.dto.EventPutRequestDto;
import com.umbrella_api.modules.schedule.dto.ScheduleGetRequestDto;
import com.umbrella_api.modules.schedule.model.EventStatus;
import com.umbrella_api.modules.schedule.model.Events;
import com.umbrella_api.modules.schedule.model.UserEvents;
import com.umbrella_api.modules.schedule.repository.EventsRepository;
import com.umbrella_api.modules.schedule.repository.UserEventsRepository;
import com.umbrella_api.modules.user.model.UserModel;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class ScheduleProvider {

    private final EventsRepository eventRepository;
    private final UserEventsRepository userEventRepository;
    private final CourseService courseService;

    public ScheduleProvider(EventsRepository eventRepository, UserEventsRepository userEventRepository,
            CourseService courseService) {
        this.eventRepository = eventRepository;
        this.userEventRepository = userEventRepository;
        this.courseService = courseService;
    }

    @Transactional
    public Events createEvent(EventPostRequestDto dto, CustomUserDetails userDetails) {
        UserModel creator = userDetails.getUserModel();

        Courses course = null;
        if (dto.courseId() != null) {
            UserModel courseCreator = courseService.getCourseCreatorById(dto.courseId());

            if (courseCreator == null || !courseCreator.getId().equals(creator.getId())) {
                throw new AccessDeniedException("Only the course creator have permisiion to create a course event");
            }

            course = courseService.getCourseById(dto.courseId());
            System.out.println("aquiiiii");
        }

        if (dto.endTime().isBefore(dto.startTime())) {
            throw new IllegalArgumentException("The end date/time must be after the start date/time.");
        }

        Events event = Events.builder()
                .title(dto.title())
                .description(dto.description())
                .startTime(dto.startTime())
                .endTime(dto.endTime())
                .type(dto.type())
                .createdBy(creator)
                .course(course)
                .build();

        event = eventRepository.save(event);

        if (course == null) {
            UserEvents userEvent = UserEvents.builder()
                    .user(creator)
                    .event(event)
                    .status(EventStatus.PENDING)
                    .reminderOffset(dto.reminderOffset())
                    .build();

            userEventRepository.save(userEvent);
        }

        return event;
    }

    @Transactional
    public UserEvents personalizeEvent(Long eventId, CustomUserDetails userDetails, EventStatus status,
            Integer reminderOffset) {
        UserModel user = userDetails.getUserModel();

        Events event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found with: " + eventId));

        UserEvents userEvent = userEventRepository.findByUserIdAndEventId(user.getId(), eventId)
                .orElseGet(() -> UserEvents.builder()
                        .user(user)
                        .event(event)
                        .build());

        if (status != null) {
            userEvent.setStatus(status);
        }
        if (reminderOffset != null) {
            userEvent.setReminderOffset(reminderOffset);
        }

        return userEventRepository.save(userEvent);
    }

    public List<Events> getAllEnrolledCoursesEvents(CustomUserDetails userDetails) {
        List<Events> events = new ArrayList<>();
        List<Courses> enrolledCourses = courseService.getEnrolledCoursesByUser(userDetails);
        for (Courses course : enrolledCourses) {
            if (course.getEvents() != null) {
                events.addAll(course.getEvents());
            }
        }
        return events;
    }

    public List<ScheduleGetRequestDto> getAllEvents(CustomUserDetails userDetails) {
        UserModel user = userDetails.getUserModel();

        List<UserEvents> userEventsList = userEventRepository.findByUserId(user.getId());
        Map<Long, UserEvents> userEventMap = userEventsList.stream()
                .collect(Collectors.toMap(
                        ue -> ue.getEvent().getId(),
                        ue -> ue,
                        (existing, replacement) -> existing));

        List<ScheduleGetRequestDto> result = new ArrayList<>();

        for (UserEvents ue : userEventsList) {
            if (ue.getEvent().getCourse() == null) {
                result.add(ScheduleGetRequestDto.fromEntity(ue.getEvent(), ue));
            }
        }

        List<Events> coursesEvents = this.getAllEnrolledCoursesEvents(userDetails);
        for (Events event : coursesEvents) {
            UserEvents userEvent = userEventMap.get(event.getId());
            result.add(ScheduleGetRequestDto.fromEntity(event, userEvent));
        }

        result.sort(Comparator.comparing(ScheduleGetRequestDto::startTime));
        return result;
    }

    @Transactional
    public void deleteEvent(Long eventId, CustomUserDetails userDetails) {
        Events event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found with id  " + eventId));

        Long userId = userDetails.getUserModel().getId();

        boolean isPersonalCreator = event.getCourse() == null && event.getCreatedBy().getId().equals(userId);
        boolean isCourseCreator = event.getCourse() != null
                && courseService.getCourseCreatorById(event.getCourse().getId()).getId().equals(userId);

        if (!isPersonalCreator && !isCourseCreator) {
            throw new AccessDeniedException("You can't delete this event.");
        }
        eventRepository.delete(event);
    }

    @Transactional
    public ScheduleGetRequestDto updateEvent(Long eventId, EventPostRequestDto dto, CustomUserDetails userDetails) {
        Events event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found."));

        if (!event.getCreatedBy().getId().equals(userDetails.getUserModel().getId())) {
            throw new AccessDeniedException("You don't have permission to alter this event.");
        }

        event.setTitle(dto.title());
        event.setDescription(dto.description());
        event.setStartTime(dto.startTime());
        event.setEndTime(dto.endTime());
        event.setType(dto.type());

        Events updatedEvent = eventRepository.save(event);

        UserEvents userEvent = userEventRepository
                .findByUserIdAndEventId(userDetails.getUserModel().getId(), eventId)
                .orElse(null);

        return ScheduleGetRequestDto.fromEntity(updatedEvent, userEvent);
    }

    @Transactional
    public Events updateEvent(Long eventId, EventPutRequestDto dto, CustomUserDetails userDetails) {
        Events event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found with id: " + eventId));

        Long userId = userDetails.getUserModel().getId();

        boolean isPersonalCreator = event.getCourse() == null && event.getCreatedBy().getId().equals(userId);
        boolean isCourseCreator = event.getCourse() != null
                && courseService.getCourseCreatorById(event.getCourse().getId()).getId().equals(userId);

        if (!isPersonalCreator && !isCourseCreator) {
            throw new AccessDeniedException("You don't have permission to alter this event.");
        }

        if (dto.endTime().isBefore(dto.startTime())) {
            throw new IllegalArgumentException("The end date must be after the start date..");
        }

        event.setTitle(dto.title());
        event.setDescription(dto.description());
        event.setStartTime(dto.startTime());
        event.setEndTime(dto.endTime());
        event.setType(dto.type());

        return eventRepository.save(event);
    }

}