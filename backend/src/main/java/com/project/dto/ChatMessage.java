package com.project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Chat messages (WebSocket communication)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    // Message type (CHAT) - useful when debugging or extending
    private String type;

    // Actual message content
    private String message;

    // Who sent the message (MENTOR / STUDENT)
    private String sender;

    // Display name (email or username)
    private String name;

    // Session ID (optional but useful for tracking)
    private String sessionId;

    // Timestamp for ordering messages
    private long timestamp;
}