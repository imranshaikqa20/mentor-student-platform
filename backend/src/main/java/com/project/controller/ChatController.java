package com.project.controller;

import com.project.dto.ChatMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@Slf4j
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // =========================================
    // 💬 CHAT HANDLER (FINAL FIXED)
    // =========================================
    @MessageMapping("/chat/{sessionId}")
    public void handleChat(
            @DestinationVariable String sessionId,
            @Payload ChatMessage message,
            Principal principal
    ) {

        log.info("=================================");
        log.info("💬 CHAT MESSAGE RECEIVED");
        log.info("Session: {}", sessionId);

        // =========================================
        // ❌ IGNORE EMPTY MESSAGE
        // =========================================
        if (message.getMessage() == null || message.getMessage().trim().isEmpty()) {
            log.warn("⚠️ Empty message ignored");
            return;
        }

        // =========================================
        // ✅ FALLBACK VALUES
        // =========================================
        if (message.getSender() == null || message.getSender().isEmpty()) {
            message.setSender("STUDENT");
        }

        if (message.getName() == null || message.getName().isEmpty()) {
            message.setName(
                    principal != null ? principal.getName() : "Unknown"
            );
        }

        // =========================================
        // ✅ METADATA (VERY IMPORTANT)
        // =========================================
        message.setSessionId(sessionId);
        message.setTimestamp(System.currentTimeMillis());
        message.setType("CHAT");

        // =========================================
        // 🧠 DEBUG LOGS
        // =========================================
        log.info("👤 User: {}", message.getName());
        log.info("🎭 Role: {}", message.getSender());
        log.info("📨 Message: {}", message.getMessage());
        log.info("=================================");

        // =========================================
        // 🔥 BROADCAST TO ALL USERS IN SESSION
        // =========================================
        messagingTemplate.convertAndSend(
                "/topic/chat/" + sessionId,
                message
        );
    }
}