package com.umbrella_api.modules.user.repository;

import com.umbrella_api.modules.user.model.UserModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository
        extends JpaRepository<UserModel, Long> {

    Optional<UserModel> findByEmail(String email);
}