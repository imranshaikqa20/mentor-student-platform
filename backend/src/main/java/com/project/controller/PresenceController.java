package com.project.controller;

import org.springframework.messaging.handler.annotation.*;
import org.springframework.stereotype.Controller;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class PresenceController {

    // ✅ Store users per session (thread-safe)
    private final Map<String, Set<String>> sessionUsers = new ConcurrentHashMap<>();

    // =========================================
    // 🔥 HANDLE JOIN / LEAVE
    // =========================================
    @MessageMapping("/presence/{sessionId}")
    @SendTo("/topic/presence/{sessionId}")
    public Map<String, Object> handlePresence(
            @DestinationVariable String sessionId,
            @Payload Map<String, String> payload
    ) {

        // ✅ Safe extraction
        String type = payload.getOrDefault("type", "").toUpperCase();
        String user = payload.getOrDefault("user", "").trim();

        // ❌ Ignore invalid input
        if (user.isEmpty()) {
            return buildResponse("ERROR", user, getUsers(sessionId));
        }

        // ✅ Initialize session if not exists
        sessionUsers.putIfAbsent(sessionId, ConcurrentHashMap.newKeySet());

        Set<String> users = sessionUsers.get(sessionId);

        // =========================================
        // 👤 JOIN
        // =========================================
        if ("JOIN".equals(type)) {
            users.add(user);
        }

        // =========================================
        // 👤 LEAVE
        // =========================================
        else if ("LEAVE".equals(type)) {
            users.remove(user);

            // ✅ Clean empty session
            if (users.isEmpty()) {
                sessionUsers.remove(sessionId);
            }
        }

        // =========================================
        // 📤 RESPONSE
        // =========================================
        return buildResponse(type, user, getUsers(sessionId));
    }

    // =========================================
    // 🔧 HELPER: GET USERS
    // =========================================
    private Set<String> getUsers(String sessionId) {
        return sessionUsers.getOrDefault(
                sessionId,
                ConcurrentHashMap.newKeySet()
        );
    }

    // =========================================
    // 🔧 HELPER: BUILD RESPONSE
    // =========================================
    private Map<String, Object> buildResponse(String type, String user, Set<String> users) {
        Map<String, Object> response = new HashMap<>();
        response.put("type", type);
        response.put("user", user);
        response.put("users", users);
        return response;
    }
}