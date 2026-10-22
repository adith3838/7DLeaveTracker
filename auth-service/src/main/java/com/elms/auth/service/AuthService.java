package com.elms.auth.service;

import com.elms.auth.dto.AuthResponse;
import com.elms.auth.dto.LoginRequest;
import com.elms.auth.dto.UserDto;
import com.elms.auth.entity.User;
import com.elms.auth.repository.UserRepository;
import com.elms.auth.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        if (!user.getIsActive()) {
            throw new RuntimeException("Account is deactivated");
        }

        String roleName = user.getRole().getName().name();
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), roleName);
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(UserDto.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(roleName)
                        .build())
                .build();
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new RuntimeException("Invalid refresh token");
        }

        String email = jwtUtil.getEmailFromToken(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String roleName = user.getRole().getName().name();
        String newAccessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), roleName);
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .user(UserDto.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(roleName)
                        .build())
                .build();
    }
}
