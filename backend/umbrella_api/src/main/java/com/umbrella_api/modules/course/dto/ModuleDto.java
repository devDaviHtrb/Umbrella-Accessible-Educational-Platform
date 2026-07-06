package com.umbrella_api.modules.course.dto;

import java.time.Duration;
import java.time.LocalDate;

public record ModuleDto(String name, String description, boolean isRequired, LocalDate creationDate,
        Duration timeLimit, Long courseId) {

}
