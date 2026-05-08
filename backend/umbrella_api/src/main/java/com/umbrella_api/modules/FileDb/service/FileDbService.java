package com.umbrella_api.modules.FileDb.service;

import java.util.Map;

import org.springframework.web.multipart.MultipartFile;

public interface FileDbService {
    public Map<String, Object> upload(MultipartFile file, String folder, String resourceType);

    public Map<String, Object> delete(String publicId, String resourceType);
}
