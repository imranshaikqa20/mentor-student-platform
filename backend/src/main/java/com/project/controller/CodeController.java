package com.project.controller;

import com.project.dto.CodeMessage;
import com.project.store.SessionStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.stereotype.Controller;
import org.springframework.util.StringUtils;

@Controller
@Slf4j
public class CodeController {

    // =========================================
    // 💻 CODE SYNC HANDLER (FINAL FIXED)
    // =========================================
    @MessageMapping("/session/{sessionId}")          // ✅ FIXED
    @SendTo("/topic/session/{sessionId}")            // ✅ FIXED
    public CodeMessage handleCode(
            @DestinationVariable String sessionId,
            @Payload CodeMessage message,
            @Header(value = "simpSessionId", required = false) String senderSessionId
    ) {

        log.info("=================================");
        log.info("💻 CODE UPDATE RECEIVED");

        // =========================================
        // 🔒 VALIDATION
        // =========================================
        if (!StringUtils.hasText(sessionId)) {
            log.warn("❌ Invalid sessionId");
            return null;
        }

        if (message == null || message.getContent() == null) {
            log.warn("❌ Empty code message");
            return null;
        }

        log.info("Session: {}", sessionId);
        log.info("SenderSession: {}", senderSessionId);

        try {
            // =========================================
            // 💾 SAVE CODE (IN-MEMORY)
            // =========================================
            SessionStore.codeMap.put(sessionId, message.getContent());

            // =========================================
            // 🧠 METADATA (IMPORTANT)
            // =========================================
            message.setSessionId(sessionId);
            message.setTimestamp(System.currentTimeMillis());
            message.setType("CODE");
            message.setSenderSessionId(senderSessionId);

            log.info("Code length: {}", message.getContent().length());
            log.info("=================================");

            return message; // ✅ broadcast to all users

        } catch (Exception e) {
            log.error("❌ Error processing code", e);
            return null;
        }
    }
}