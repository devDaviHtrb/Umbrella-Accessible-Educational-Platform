package com.umbrella_api.modules.storage.controller;

import com.umbrella_api.common.dto.GenericResponse;
import com.umbrella_api.modules.storage.api.StorageService;
import com.umbrella_api.modules.storage.model.Image;
import com.umbrella_api.modules.storage.model.RawFile;
import com.umbrella_api.modules.storage.model.Video;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/storage")
public class StorageController {

    private final StorageService storageService;

    public StorageController(StorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<GenericResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("resourceType") String resourceType,
            @RequestParam(value = "alternativeText", required = false) String alternativeText,
            @RequestParam("fileName") String fileName,
            @RequestParam(value = "fileDescription", required = false) String fileDescription) {

        GenericResponse response = storageService.upload(
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
        return ResponseEntity.ok(storageService.getImageById(id));
    }

    @GetMapping("/video/{id}")
    public ResponseEntity<Video> getVideoById(@PathVariable long id) {
        return ResponseEntity.ok(storageService.getVideoById(id));
    }

    @GetMapping("/raw/{id}")
    public ResponseEntity<RawFile> getRawById(@PathVariable long id) {
        return ResponseEntity.ok(storageService.getRawFileById(id));
    }
}