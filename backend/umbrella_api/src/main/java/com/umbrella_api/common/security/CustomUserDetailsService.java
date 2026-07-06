package com.umbrella_api.common.security;

import com.umbrella_api.modules.user.model.UserModel;
import com.umbrella_api.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService
                implements UserDetailsService {

        private final UserRepository repository;

        @Override
        public UserDetails loadUserByUsername(
                        String email) throws UsernameNotFoundException {

                UserModel user = repository
                                .findByEmail(email)
                                .orElseThrow(
                                                () -> new UsernameNotFoundException(email));

                return new CustomUserDetails(user);
        }
}