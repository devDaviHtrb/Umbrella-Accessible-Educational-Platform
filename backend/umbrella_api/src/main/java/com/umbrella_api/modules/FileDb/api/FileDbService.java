package com.umbrella_api.modules.FileDb.api;

import java.util.Map;

import org.apache.tomcat.util.http.fileupload.FileUpload;
import org.springframework.web.multipart.MultipartFile;

import com.umbrella_api.modules.FileDb.dto.DeleteFileResponse;
import com.umbrella_api.modules.FileDb.dto.FileUploadResponse;

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
    public FileUploadResponse upload(MultipartFile file, String folder, String resourceType);

    /*
     * returns Map<String, Object>
     * {
     * "result": String("ok" or "not found")
     * "partial": Bool (This refers to the successful operation of clearing the
     * image database cache.)
     * }
     */
    public DeleteFileResponse delete(String publicId, String resourceType);
}
