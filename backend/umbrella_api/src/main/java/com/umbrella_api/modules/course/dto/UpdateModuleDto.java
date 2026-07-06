package com.umbrella_api.modules.course.dto;

import java.time.Duration;

public record UpdateModuleDto(String name, String description, boolean isRequired, Duration timeLimit) {

}
