package com.umbrella_api.modules.course.dto;

import java.time.Duration;
import java.time.LocalDate;

public record ModuleRequestDto(String name, String description, boolean isRequired, LocalDate creationDate,
                Duration timeLimit, Long courseId) {

}
