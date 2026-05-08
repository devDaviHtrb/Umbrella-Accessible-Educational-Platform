package com.umbrella_api.modules.FileDb.api;

import java.util.Map;

import org.springframework.web.multipart.MultipartFile;

public interface FileDbService {
    /*
     * returns Map<String, Object>
     * {
     * "asset_id": String,
     * "public_id": String",
     * "version": int,
     * "width": int (pixels),
     * "height": int (pixels),
     * "format": String (jpg, webp, png, etc...),
     * "resource_type": String (image or raw),
     * "secure_url": String,
     * "bytes": int
     * }
     */
    public Map<String, Object> upload(MultipartFile file, String folder, String resourceType);

    /*
     * returns Map<String, Object>
     * {
     * "result": String("ok" or "not found")
     * "partial": Bool (This refers to the successful operation of clearing the
     * image database cache.)
     * }
     */
    public Map<String, Object> delete(String publicId, String resourceType);
}
