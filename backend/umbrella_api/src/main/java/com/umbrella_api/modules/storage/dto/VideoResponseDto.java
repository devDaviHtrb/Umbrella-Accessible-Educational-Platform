package com.umbrella_api.modules.storage.dto;

import com.umbrella_api.modules.storage.model.Video;

public record VideoResponseDto(
        String resourceType,
        String url,
        String fileDbId,
        Double duration,
        FileMetaDataDto metaData) {
    public static VideoResponseDto fromEntity(Video vid) {
        if (vid == null)
            return null;
        return new VideoResponseDto(
                vid.getResourceType(),
                vid.getUrl(),
                vid.getFileDbId(),
                vid.getDuration(),
                FileMetaDataDto.fromEntity(vid.getFileMetaData()));
    }
}