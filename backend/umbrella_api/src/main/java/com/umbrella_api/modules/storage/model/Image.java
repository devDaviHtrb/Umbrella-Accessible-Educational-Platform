package com.umbrella_api.modules.storage.model;

import com.umbrella_api.modules.storage.common.BaseFileEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@Table(name = "images")
@SuperBuilder
public class Image extends BaseFileEntity {

    int width;
    int height;

    @Column(nullable = false, length = 500)
    String alternativeText;

    @OneToOne(mappedBy = "image")
    private FileMetaData fileMetaData;

    @Override
    public String getResourceType() {
        return "image";
    }

    @Override
    public void setFile(FileMetaData file) {
        this.fileMetaData = file;
    }
}
