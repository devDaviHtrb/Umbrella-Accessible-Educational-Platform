package com.umbrella_api.modules.activity.dto;

public record AlternativeUpdateRequestDto(
        Boolean correct,
        String letter,
        String text) {
}