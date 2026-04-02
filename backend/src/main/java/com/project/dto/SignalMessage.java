package com.project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for WebRTC signaling messages (Video Call)
 * Used to exchange OFFER, ANSWER, and ICE candidates
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignalMessage {

    // Type of signal: OFFER / ANSWER / ICE
    private String type;

    // SDP or ICE candidate (JSON string)
    private String content;

    // Optional: who sent the signal (MENTOR / STUDENT)
    private String sender;

    // Optional: session ID for tracking/debugging
    private String sessionId;

    // Timestamp for ordering / debugging
    private long timestamp;
}