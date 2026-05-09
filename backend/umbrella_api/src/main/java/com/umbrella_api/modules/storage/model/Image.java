package com.umbrella_api.modules.storage.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@Table(name = "IMAGE")
@SuperBuilder
public class Image extends BaseFile {

    int width;
    int height;

    @Column(nullable = false, length = 500)
    String alternativeText;

    @Override
    public String getResourceType() {
        return "image";
    }
}
