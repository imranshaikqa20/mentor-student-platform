package com.project.config;

import com.project.security.JwtUtil;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.*;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuthChannelInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {

        StompHeaderAccessor accessor =
                StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {

            String authHeader =
                    accessor.getFirstNativeHeader("Authorization");

            log.info("📩 WS CONNECT Authorization: {}", authHeader);

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new RuntimeException("Missing Authorization header");
            }

            String token = authHeader.substring(7);

            try {
                Claims claims = jwtUtil.validateTokenAndGetClaims(token);

                String email = claims.getSubject();

                log.info("✅ WS Authenticated: {}", email);

                accessor.setUser(() -> email);

            } catch (Exception e) {
                log.error("❌ Invalid JWT Token", e);
                throw new RuntimeException("Invalid JWT Token");
            }
        }

        return message;
    }
}