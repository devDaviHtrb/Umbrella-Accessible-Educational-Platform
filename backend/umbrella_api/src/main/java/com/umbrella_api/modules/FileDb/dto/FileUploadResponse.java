package com.umbrella_api.modules.FileDb.dto;

public record FileUploadResponse(
        String url,
        String publicId,
        String format,
        String resourceType,
        int width,
        int height) {
}
