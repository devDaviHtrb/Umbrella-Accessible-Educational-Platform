package com.umbrella_api.modules.course.dto;

public record AlternativeUpdateRequestDto(
        Boolean correct,
        String letter,
        String text) {
}