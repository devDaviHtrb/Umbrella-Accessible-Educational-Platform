package com.umbrella_api.modules.storage.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.umbrella_api.modules.FileDb.dto.FileUploadResponse;
import com.umbrella_api.modules.storage.common.BaseFileEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "raws")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class RawFile extends BaseFileEntity {

    @Column(name = "file_type")
    private String type;

    @OneToOne(mappedBy = "rawFile")
    @JsonManagedReference
    private FileMetaData fileMetaData;

    @Override
    public String getResourceType() {
        return "raw";
        // raw: .txt, .csv, .docx, .xlsx and .json.
    }

    @Override
    public void setFile(FileMetaData file) {
        this.fileMetaData = file;
    }

    public static RawFile create(FileUploadResponse data, FileMetaData meta, String fileExtension) {
        return RawFile.builder()
                .fileDbId(data.publicId())
                .url(data.url())
                .fileMetaData(meta)
                .type(fileExtension)
                .build();
    }
}
