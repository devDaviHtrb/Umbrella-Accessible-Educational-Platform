package com.umbrella_api.modules.storage.dto;

import java.util.List;
import com.umbrella_api.modules.storage.model.FileMetaData;

public record FileMetaDataResponseDto(
        Long id,
        String title,
        String status,
        String description,
        int size,
        Long moduleId,
        String resourceType,
        String url,
        String fileType,
        // Id da entidade Video quando o material é um vídeo (o app usa este id
        // para buscar as legendas em /video/{videoId}/subtitles). Null caso
        // contrário.
        Long videoId
) {
    public static FileMetaDataResponseDto fromEntity(FileMetaData meta) {
        if (meta == null)
            return null;

        String resourceType = null;
        String url = null;
        String fileType = null;
        Long videoId = null;

        if (meta.getImage() != null) {
            resourceType = meta.getImage().getResourceType();
            url = meta.getImage().getUrl();
            fileType = meta.getImage().getType();
        } else if (meta.getRawFile() != null) {
            resourceType = meta.getRawFile().getResourceType();
            url = meta.getRawFile().getUrl();
            fileType = meta.getRawFile().getType();
        } else if (meta.getVideo() != null) {
            resourceType = meta.getVideo().getResourceType();
            url = meta.getVideo().getUrl();
            fileType = "video";
            videoId = meta.getVideo().getId();
        }

        return new FileMetaDataResponseDto(
                meta.getId(),
                meta.getTitle(),
                meta.getStatus(),
                meta.getDescription(),
                meta.getSize(),
                meta.getModule() != null ? meta.getModule().getId() : null,
                resourceType,
                url,
                fileType,
                videoId
        );
    }

    public static List<FileMetaDataResponseDto> fromEntityList(List<FileMetaData> list) {
        if (list == null || list.isEmpty()) {
            return List.of();
        }
        return list.stream()
                .map(FileMetaDataResponseDto::fromEntity)
                .toList();
    }
}
