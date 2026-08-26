package com.umbrella_api.modules.user.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.umbrella_api.modules.schedule.model.Events;
import com.umbrella_api.modules.schedule.model.UserEvents;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import com.umbrella_api.modules.course.model.CourseUserRelation;
import com.umbrella_api.modules.storage.model.Image;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserModel {

    @Id
    @GeneratedValue
    private Long id; // id

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = true)
    private String neurodivergence;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles")
    @Enumerated(EnumType.STRING)
    private Set<UserRole> roles;

    @Builder.Default
    @OneToMany(mappedBy = "user")
    @JsonIgnore
    private List<Image> images = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "user")
    @JsonIgnore
    private List<CourseUserRelation> courseUserRelations = new ArrayList<>();

    @OneToMany(mappedBy = "createdBy", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Events> createdEvents = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<UserEvents> userEvents = new ArrayList<>();

}
