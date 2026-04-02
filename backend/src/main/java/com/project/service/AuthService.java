package com.project.service;

import com.project.dto.AuthRequest;
import com.project.entity.User;
import com.project.repository.UserRepository;
import com.project.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    // =======================
    // ✅ SIGNUP (RETURN USER)
    // =======================
    public User signupUser(AuthRequest req) {

        String email = req.getEmail().toLowerCase().trim();

        log.info("Signup request: {}", email);

        // ❌ Check if user exists
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("User already exists with this email");
        }

        // ❌ Validate role
        String role = req.getRole();
        if (role == null || (!role.equals("MENTOR") && !role.equals("STUDENT"))) {
            throw new RuntimeException("Invalid role. Must be MENTOR or STUDENT");
        }

        // ❌ Validate password
        if (req.getPassword() == null || req.getPassword().length() < 4) {
            throw new RuntimeException("Password must be at least 4 characters");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(role);

        userRepository.save(user);

        log.info("User registered successfully: {}", email);

        // ✅ generate token and attach
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        user.setToken(token); // ⚠️ transient field (not DB)

        return user;
    }

    // =======================
    // ✅ LOGIN (RETURN USER)
    // =======================
    public User loginUser(AuthRequest req) {

        String email = req.getEmail().toLowerCase().trim();

        log.info("Login request: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ❌ Check password
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        log.info("Login successful: {}", email);

        // ✅ generate token
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        user.setToken(token); // ⚠️ temporary

        return user;
    }
}