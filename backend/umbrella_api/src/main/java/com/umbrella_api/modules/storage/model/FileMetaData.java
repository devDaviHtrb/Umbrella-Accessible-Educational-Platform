package com.umbrella_api.modules.storage.model;

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
    private Long size;

    @OneToOne
    @JoinColumn(name = "image_id", referencedColumnName = "id")
    private Image image;

    @OneToOne
    @JoinColumn(name = "raw_id", referencedColumnName = "id")
    private RawFile rawFile;

    @OneToOne
    @JoinColumn(name = "video_id", referencedColumnName = "id")
    private Videos videos; 
}
