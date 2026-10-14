package com.umbrella_api.modules.storage.dto;

import com.umbrella_api.modules.course.model.Modules;
import com.umbrella_api.modules.storage.model.FileMetaData;

public record FileMetaDataDto(
        Long id,
        String title,
        String status,
        String description,
        int size,
        Modules module) {
    public static FileMetaDataDto fromEntity(FileMetaData meta) {
        if (meta == null)
            return null;
        return new FileMetaDataDto(
                meta.getId(),
                meta.getTitle(),
                meta.getStatus(),
                meta.getDescription(),
                meta.getSize(),
                meta.getModule());
    }
}