package com.project.controller;

import com.project.dto.AuthRequest;
import com.project.dto.AuthResponse;
import com.project.entity.User;
import com.project.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final AuthService service;

    // =======================
    // ✅ SIGNUP
    // =======================
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody AuthRequest req) {

        try {
            log.info("Signup attempt for email: {}", req.getEmail());

            if (req.getEmail() == null || req.getPassword() == null) {
                return ResponseEntity.badRequest().body("Email and Password are required");
            }

            User user = service.signupUser(req);

            log.info("Signup successful for email: {}", req.getEmail());

            return ResponseEntity.ok(new AuthResponse(
                    user.getToken(),
                    user.getEmail(),
                    user.getRole() // ✅ FIXED (no .name())
            ));

        } catch (RuntimeException e) {
            log.error("Signup failed (business): {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());

        } catch (Exception e) {
            log.error("Signup failed (unexpected): ", e);
            return ResponseEntity.internalServerError().body("Signup failed");
        }
    }

    // =======================
    // ✅ LOGIN
    // =======================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest req) {

        try {
            log.info("Login attempt for email: {}", req.getEmail());

            if (req.getEmail() == null || req.getPassword() == null) {
                return ResponseEntity.badRequest().body("Email and Password are required");
            }

            User user = service.loginUser(req);

            log.info("Login successful for email: {}", req.getEmail());

            return ResponseEntity.ok(new AuthResponse(
                    user.getToken(),
                    user.getEmail(),
                    user.getRole() // ✅ FIXED (no .name())
            ));

        } catch (RuntimeException e) {
            log.error("Login failed (business): {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());

        } catch (Exception e) {
            log.error("Login failed (unexpected): ", e);
            return ResponseEntity.internalServerError().body("Login failed");
        }
    }
}