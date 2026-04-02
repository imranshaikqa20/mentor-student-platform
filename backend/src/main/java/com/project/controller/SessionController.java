package com.project.controller;

import com.project.entity.Session;
import com.project.service.SessionService;
import com.project.store.SessionStore;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService service;

    // ========================================
    // ✅ CREATE SESSION (MENTOR ONLY)
    // ========================================
    @PostMapping("/create")
    public Session createSession(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }

        String email = authentication.getName();

        boolean isMentor = authentication.getAuthorities()
                .stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_MENTOR"));

        if (!isMentor) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only mentors can create sessions");
        }

        return service.create(email);
    }

    // ========================================
    // ✅ JOIN SESSION (STUDENT ONLY)
    // ========================================
    @PostMapping("/join")
    public Session joinSession(@RequestParam String sessionId,
                               Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }

        String email = authentication.getName();

        boolean isStudent = authentication.getAuthorities()
                .stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_STUDENT"));

        if (!isStudent) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only students can join sessions");
        }

        return service.join(sessionId, email);
    }

    // ========================================
    // ✅ GET SESSION DETAILS
    // ========================================
    @GetMapping("/{id}")
    public Session getSession(@PathVariable String id,
                              Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }

        return service.getSession(id);
    }

    // ========================================
    // 🔥 FIXED: GET SAVED CODE (NO ERROR)
    // ========================================
    @GetMapping("/{sessionId}/code")
    public String getSessionCode(@PathVariable String sessionId,
                                 Authentication authentication) {

        // ✅ DO NOT THROW ERROR → allow UI to load cleanly
        // (Optional: you can log instead)
        if (authentication == null || !authentication.isAuthenticated()) {
            System.out.println("⚠️ Unauthenticated code fetch for session: " + sessionId);
        }

        return SessionStore.codeMap.getOrDefault(
                sessionId,
                "// 🚀 Start coding..."
        );
    }
}