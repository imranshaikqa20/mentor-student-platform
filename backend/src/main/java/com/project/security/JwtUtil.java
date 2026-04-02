package com.project.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    private Key key;

    // =========================================
    // 🔐 INIT SECRET KEY
    // =========================================
    @PostConstruct
    public void init() {
        try {
            this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
            log.info("JWT key initialized successfully");
        } catch (Exception e) {
            log.error("Error initializing JWT key: {}", e.getMessage());
            throw new RuntimeException("Invalid JWT secret key");
        }
    }

    // =========================================
    // ✅ GENERATE TOKEN (🔥 FIXED HERE)
    // =========================================
    public String generateToken(String username, String role) {

        Map<String, Object> claims = new HashMap<>();

        // 🔥 CRITICAL FIX: ensure ROLE_ prefix
        if (role != null && !role.startsWith("ROLE_")) {
            role = "ROLE_" + role;
        }

        claims.put("role", role);

        log.info("🔐 Generating token for {} with role {}", username, role);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // =========================================
    // ✅ EXTRACT USERNAME
    // =========================================
    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    // =========================================
    // ✅ EXTRACT ROLE
    // =========================================
    public String extractRole(String token) {
        Object role = extractAllClaims(token).get("role");
        return role != null ? role.toString() : null;
    }

    // =========================================
    // ✅ EXTRACT EXPIRATION
    // =========================================
    public Date extractExpiration(String token) {
        return extractAllClaims(token).getExpiration();
    }

    // =========================================
    // ⏰ CHECK TOKEN EXPIRY
    // =========================================
    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // =========================================
    // ✅ VALIDATE TOKEN (BOOLEAN)
    // =========================================
    public boolean validate(String token) {

        try {
            if (token == null || token.trim().isEmpty()) {
                log.warn("JWT token is null or empty");
                return false;
            }

            Claims claims = extractAllClaims(token);

            return claims.getSubject() != null && !isTokenExpired(token);

        } catch (Exception e) {
            log.error("JWT validation error: {}", e.getMessage());
            return false;
        }
    }

    // =========================================
    // 🔥 VALIDATE + RETURN CLAIMS
    // =========================================
    public Claims validateTokenAndGetClaims(String token) {

        try {
            if (token == null || token.trim().isEmpty()) {
                throw new RuntimeException("Token is empty");
            }

            Claims claims = extractAllClaims(token);

            if (claims.getSubject() == null) {
                throw new RuntimeException("Invalid token: no subject");
            }

            if (isTokenExpired(token)) {
                throw new RuntimeException("Token expired");
            }

            return claims;

        } catch (ExpiredJwtException e) {
            log.warn("JWT expired: {}", e.getMessage());
            throw new RuntimeException("Token expired");

        } catch (Exception e) {
            log.error("JWT validation error: {}", e.getMessage());
            throw new RuntimeException("Invalid JWT token");
        }
    }

    // =========================================
    // 🔍 EXTRACT ALL CLAIMS
    // =========================================
    private Claims extractAllClaims(String token) {

        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}