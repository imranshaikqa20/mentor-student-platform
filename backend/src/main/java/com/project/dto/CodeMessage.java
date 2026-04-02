package com.project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for real-time code editor communication
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CodeMessage {

    // Type of message (always "CODE")
    private String type = "CODE";

    // Actual code content
    private String content;

    // Who sent the update (MENTOR / STUDENT)
    private String sender;

    // 🔥 NEW: WebSocket session ID (VERY IMPORTANT)
    // Used to prevent infinite update loops in frontend
    private String senderSessionId;

    // Session id
    private String sessionId;

    // Timestamp for ordering updates
    private long timestamp;
}