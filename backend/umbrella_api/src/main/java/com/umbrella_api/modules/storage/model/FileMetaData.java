package com.umbrella_api.modules.storage.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.experimental.SuperBuilder;

@Entity
@Data
@Table(name = "files")
@SuperBuilder
public class FileMetaData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(nullable = false)
    String title;

    // awaiting the data dict
    @Column(nullable = false)
    String status;

    @Column
    String description;

    @Column
    long size;

    @OneToOne
    @JoinColumn(name = "image_id", referencedColumnName = "id", nullable = true)
    private Image image;

    @OneToOne
    @JoinColumn(name = "raw_id", referencedColumnName = "id", nullable = true)
    private RawFile rawFile;

}
