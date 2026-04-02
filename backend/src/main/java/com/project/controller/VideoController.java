package com.project.controller;

import com.project.dto.SignalMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@Slf4j
public class VideoController {

    private final SimpMessagingTemplate messagingTemplate;

    // =========================================
    // ✅ CONSTRUCTOR
    // =========================================
    public VideoController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // =========================================
    // 📹 VIDEO SIGNAL HANDLER (FINAL FIXED)
    // =========================================
    @MessageMapping("/video/{sessionId}")
    public void handleVideo(
            @DestinationVariable String sessionId,
            @Payload SignalMessage message
    ) {

        log.info("=================================");
        log.info("📡 VIDEO SIGNAL RECEIVED");
        log.info("📌 Session: {}", sessionId);

        // =========================================
        // ❌ VALIDATION
        // =========================================
        if (message == null || message.getType() == null) {
            log.warn("⚠ Invalid signal received");
            return;
        }

        String type = message.getType().toUpperCase();

        // =========================================
        // 🧠 LOG TYPES
        // =========================================
        switch (type) {
            case "JOIN":
                log.info("👤 USER JOINED");
                break;

            case "OFFER":
                log.info("📡 OFFER received");
                break;

            case "ANSWER":
                log.info("📡 ANSWER received");
                break;

            case "ICE":
                log.info("🧊 ICE candidate received");
                break;

            default:
                log.warn("⚠ Unknown signal type: {}", type);
        }

        // =========================================
        // ✅ METADATA (CRITICAL)
        // =========================================
        message.setSessionId(sessionId);
        message.setTimestamp(System.currentTimeMillis());

        log.info("📤 Broadcasting to /topic/video/{}", sessionId);
        log.info("=================================");

        // =========================================
        // 🔥 BROADCAST TO ALL USERS
        // =========================================
        messagingTemplate.convertAndSend(
                "/topic/video/" + sessionId,
                message
        );
    }
}