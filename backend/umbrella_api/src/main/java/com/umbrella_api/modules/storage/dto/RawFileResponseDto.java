package com.umbrella_api.modules.storage.dto;

import com.umbrella_api.modules.storage.model.RawFile;

public record RawFileResponseDto(
        String resourceType,
        String url,
        String fileDbId,
        String type,
        FileMetaDataDto metaData) {
    public static RawFileResponseDto fromEntity(RawFile raw) {
        if (raw == null)
            return null;
        return new RawFileResponseDto(
                raw.getResourceType(),
                raw.getUrl(),
                raw.getFileDbId(),
                raw.getType(),
                FileMetaDataDto.fromEntity(raw.getFileMetaData()));
    }
}