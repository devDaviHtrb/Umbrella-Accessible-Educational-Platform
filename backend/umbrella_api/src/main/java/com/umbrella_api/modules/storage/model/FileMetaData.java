package com.umbrella_api.modules.storage.model;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * WHY USE ORM RELATIONSHIPS (JPA) IN THE STORAGE MODULE?
 * 
 * Unlike the rest of the Umbrella ecosystem—where we use raw IDs to decouple
 * modules and maximize performance—the Storage module has a strict, physical
 * dependency with the binary files hosted in Cloudinary (Image, Video,
 * RawFile).
 * 
 * Using managed ORM relationships (@OneToOne, @JoinColumn) is justified here
 * to:
 * 1. Enforce Referential Integrity: A FileMetaData object cannot exist as an
 * orphan
 * without its respective indexed physical file.
 * 2. Lifecycle Automation: It enables the use of cascading operations, ensuring
 * that
 * if metadata is cleared or updated, the database handles deletions atomically,
 * making it seamless to sync with binary deletions via the Cloudinary API.
 * 
 * The use of @JsonBackReference prevents infinite recursion loops when
 * serializing
 * these entities into JSON for the consuming APIs.
 */

@Entity
@Table(name = "files")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class FileMetaData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String status;

    @Column
    private String description;

    @Column(nullable = false)
    private int size;

    @Column(name = "module_id")
    private Long moduleId;

    @OneToOne
    @JoinColumn(name = "image_id", referencedColumnName = "id")
    @JsonBackReference
    private Image image;

    @OneToOne
    @JoinColumn(name = "raw_id", referencedColumnName = "id")
    @JsonBackReference
    private RawFile rawFile;

    @OneToOne
    @JoinColumn(name = "video_id", referencedColumnName = "id")
    @JsonBackReference
    private Video video;

}
