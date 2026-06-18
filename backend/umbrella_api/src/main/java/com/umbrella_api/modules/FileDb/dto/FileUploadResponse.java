package com.umbrella_api.modules.FileDb.dto;

public record FileUploadResponse(
        String url,
        String publicId,
        String format,
        String resourceType,
        Integer width,
        Integer height,
        Integer bytes,
        Double duration) {
}
