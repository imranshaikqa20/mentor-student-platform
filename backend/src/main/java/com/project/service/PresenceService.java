package com.project.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceService {

    // ✅ Store users per session
    private final Map<String, Set<String>> sessionUsers = new ConcurrentHashMap<>();

    // =========================================
    // 👤 ADD USER (JOIN)
    // =========================================
    public Set<String> addUser(String sessionId, String user) {

        sessionUsers.putIfAbsent(sessionId, ConcurrentHashMap.newKeySet());

        Set<String> users = sessionUsers.get(sessionId);
        users.add(user);

        return users;
    }

    // =========================================
    // 👤 REMOVE USER (LEAVE)
    // =========================================
    public Set<String> removeUser(String sessionId, String user) {

        if (!sessionUsers.containsKey(sessionId)) {
            return ConcurrentHashMap.newKeySet();
        }

        Set<String> users = sessionUsers.get(sessionId);
        users.remove(user);

        // ✅ Clean empty session
        if (users.isEmpty()) {
            sessionUsers.remove(sessionId);
        }

        return users;
    }

    // =========================================
    // 👥 GET USERS
    // =========================================
    public Set<String> getUsers(String sessionId) {

        return sessionUsers.getOrDefault(
                sessionId,
                ConcurrentHashMap.newKeySet()
        );
    }
}