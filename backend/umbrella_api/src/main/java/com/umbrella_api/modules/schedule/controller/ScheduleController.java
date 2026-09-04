package com.umbrella_api.modules.schedule.controller;

import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.schedule.api.ScheduleService;
import com.umbrella_api.modules.schedule.dto.EventPostRequestDto;
import com.umbrella_api.modules.schedule.dto.EventPutRequestDto;
import com.umbrella_api.modules.schedule.dto.ScheduleGetRequestDto;
import com.umbrella_api.modules.schedule.model.EventStatus;
import com.umbrella_api.modules.schedule.model.Events;
import com.umbrella_api.modules.schedule.model.UserEvents;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedule")
public class ScheduleController {

    private final ScheduleService scheduleService;

    public ScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }


    @PostMapping
    public ResponseEntity<Events> createEvent(
            @Valid @RequestBody EventPostRequestDto dto,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Events event = scheduleService.createEvent(dto, userDetails);
        return ResponseEntity.status(HttpStatus.CREATED).body(event);
    }


    @GetMapping
    public ResponseEntity<List<ScheduleGetRequestDto>> getAllEvents(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<ScheduleGetRequestDto> events = scheduleService.getAllEvents(userDetails);
        return ResponseEntity.ok(events);
    }


    @PatchMapping("/{eventId}/personalize")
    public ResponseEntity<UserEvents> personalizeEvent(
            @PathVariable Long eventId,
            @RequestParam(required = false) EventStatus status,
            @RequestParam(required = false) Integer reminderOffset,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UserEvents userEvent = scheduleService.personalizeEvent(eventId, userDetails, status, reminderOffset);
        return ResponseEntity.ok(userEvent);
    }


    @DeleteMapping("/{eventId}")
    public ResponseEntity<Void> deleteEvent(
            @PathVariable Long eventId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        scheduleService.deleteEvent(eventId, userDetails);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{eventId}")
    public ResponseEntity<Events> updateEvent(
            @PathVariable Long eventId,
            @Valid @RequestBody EventPutRequestDto dto,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Events updatedEvent = scheduleService.updateEvent(eventId, dto, userDetails);
        return ResponseEntity.ok(updatedEvent);
    }
}