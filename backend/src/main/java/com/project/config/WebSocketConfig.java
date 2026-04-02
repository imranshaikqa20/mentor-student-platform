package com.project.config;

import com.project.security.JwtUtil;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.*;
import org.springframework.messaging.simp.config.*;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.*;

import java.security.Principal;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtil jwtUtil;

    // =========================================
    // 🌐 REGISTER WEBSOCKET ENDPOINT
    // =========================================
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // ✅ browser fallback
    }

    // =========================================
    // 📡 MESSAGE BROKER CONFIG
    // =========================================
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {

        registry.setApplicationDestinationPrefixes("/app");

        registry.enableSimpleBroker("/topic", "/queue")
                .setHeartbeatValue(new long[]{10000, 10000})
                .setTaskScheduler(taskScheduler());

        registry.setUserDestinationPrefix("/user");
    }

    // =========================================
    // ❤️ HEARTBEAT CONFIG
    // =========================================
    @Bean
    public ThreadPoolTaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(4);
        scheduler.setThreadNamePrefix("ws-heartbeat-");
        scheduler.initialize();
        return scheduler;
    }

    // =========================================
    // 🔐 JWT AUTH INTERCEPTOR (SAFE + ROBUST)
    // =========================================
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {

        registration.interceptors(new ChannelInterceptor() {

            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {

                StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

                // =========================================
                // 🔗 CONNECT HANDLING
                // =========================================
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {

                    String authHeader = accessor.getFirstNativeHeader("Authorization");

                    log.info("📩 WS CONNECT Authorization: {}", authHeader);

                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        try {
                            String token = authHeader.substring(7);

                            Claims claims = jwtUtil.validateTokenAndGetClaims(token);
                            String email = claims.getSubject();

                            log.info("✅ WS Authenticated User: {}", email);

                            accessor.setUser(new StompPrincipal(email));

                        } catch (Exception e) {
                            log.error("❌ Invalid JWT, allowing anonymous", e);
                        }
                    } else {
                        log.warn("⚠️ No JWT provided, anonymous connection");
                    }
                }

                // =========================================
                // ❗ DISCONNECT LOG (IMPORTANT FOR PRESENCE)
                // =========================================
                if (StompCommand.DISCONNECT.equals(accessor.getCommand())) {

                    Principal user = accessor.getUser();

                    if (user != null) {
                        log.info("🔌 User disconnected: {}", user.getName());
                    } else {
                        log.info("🔌 Anonymous user disconnected");
                    }
                }

                return message;
            }
        });
    }

    // =========================================
    // ⚡ TRANSPORT CONFIG
    // =========================================
    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registry) {

        registry.setMessageSizeLimit(128 * 1024);
        registry.setSendTimeLimit(30 * 1000);
        registry.setSendBufferSizeLimit(1024 * 1024);
    }

    // =========================================
    // 👤 CUSTOM PRINCIPAL
    // =========================================
    public static class StompPrincipal implements Principal {

        private final String name;

        public StompPrincipal(String name) {
            this.name = name;
        }

        @Override
        public String getName() {
            return name;
        }
    }
}