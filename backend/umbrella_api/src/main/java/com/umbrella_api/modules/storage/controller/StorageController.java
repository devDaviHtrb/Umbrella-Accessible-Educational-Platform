package com.umbrella_api.modules.storage.controller;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.modules.storage.infra.StorageServiceProvider;
import com.umbrella_api.modules.storage.model.Image;
import com.umbrella_api.modules.storage.model.RawFile;
import com.umbrella_api.modules.storage.model.Video;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/storage")
public class StorageController {

    private final StorageServiceProvider storageServiceProvider;

    StorageController(StorageServiceProvider storageServiceProvider) {
        this.storageServiceProvider = storageServiceProvider;
    }

    @PostMapping("/upload")
    public ResponseEntity<GenericResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("resourceType") String resourceType,
            @RequestParam(value = "alternativeText", required = false) String alternativeText,
            @RequestParam("fileName") String fileName,
            @RequestParam(value = "fileDescription", required = false) String fileDescription) {

        GenericResponse response = storageServiceProvider.upload(
                file,
                resourceType,
                alternativeText,
                fileName,
                fileDescription);

        if (response.status().equalsIgnoreCase("Error")) {
            return ResponseEntity.status(400).body(response);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/image/{id}")
    public ResponseEntity<Image> getImageById(@PathVariable long id) {
        return storageServiceProvider.getImageById(id)
                .map(image -> ResponseEntity.ok().body(image))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/video/{id}")
    public ResponseEntity<Video> getVideoById(@PathVariable long id) {
        return storageServiceProvider.getVideoById(id)
                .map(video -> ResponseEntity.ok().body(video))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/raw/{id}")
    public ResponseEntity<RawFile> getRawById(@PathVariable long id) {
        return storageServiceProvider.getRawFileById(id)
                .map(raw -> ResponseEntity.ok().body(raw))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}