package com.project.controller;

import com.project.store.SessionStore;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/session")
@RequiredArgsConstructor
public class SessionRestController {

    // ========================================
    // 🔥 GET SESSION CODE (SECURED)
    // ========================================
    @GetMapping("/{sessionId}/code")
    public String getCode(@PathVariable String sessionId,
                          Authentication authentication) {

        // 🔒 Check authentication
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User not authenticated"
            );
        }

        // ⚠️ Validate sessionId
        if (sessionId == null || sessionId.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid session ID"
            );
        }

        // ✅ Get code safely
        return SessionStore.codeMap.getOrDefault(
                sessionId,
                "// 🚀 Start coding..."
        );
    }
}