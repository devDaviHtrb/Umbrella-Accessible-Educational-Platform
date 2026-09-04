package com.umbrella_api.modules.storage.dto;

import com.umbrella_api.modules.storage.model.Image;

public record ImageResponseDto(
        String resourceType,
        String url,
        String fileDbId,
        Integer width,
        Integer height,
        String type,
        String alternativeText,
        FileMetaDataDto metaData) {
    public static ImageResponseDto fromEntity(Image img) {
        if (img == null)
            return null;
        return new ImageResponseDto(
                img.getResourceType(),
                img.getUrl(),
                img.getFileDbId(),
                img.getWidth(),
                img.getHeight(),
                img.getType(),
                img.getAlternativeText(),
                FileMetaDataDto.fromEntity(img.getFileMetaData()));
    }
}