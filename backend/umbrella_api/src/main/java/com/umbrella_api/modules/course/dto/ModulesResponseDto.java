package com.umbrella_api.modules.course.dto;

import java.time.Duration;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import com.umbrella_api.modules.course.model.Modules;

public record ModulesResponseDto(Long id, String name, boolean required, LocalDate creation_date, Duration time_limit) {
    public static ModulesResponseDto fromEntity(Modules module) {
        return new ModulesResponseDto(module.getId(), module.getName(), module.isRequired(), module.getCreation_date(),
                module.getTime_limit());
    }

    public static List<ModulesResponseDto> fromEntityList(List<Modules> modules) {
        if (modules == null || modules.isEmpty()) {
            return List.of();
        }
        return modules.stream()
                .map(ModulesResponseDto::fromEntity)
                .collect(Collectors.toList());
    }
}