package com.umbrella_api.common.dto;

public record GenericResponse(String status, String message, int code) {
}