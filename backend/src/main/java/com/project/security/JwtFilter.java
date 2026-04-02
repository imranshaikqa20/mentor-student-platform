package com.project.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@RequiredArgsConstructor
@Slf4j
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        try {

            // 🔥 FIX: Use correct path
            String path = request.getRequestURI();

            log.info("🌐 Incoming request path: {}", path);

            // ========================================
            // 🔥 SKIP ONLY AUTH + WS
            // ========================================
            if (path.startsWith("/api/auth") ||
                    path.startsWith("/ws")) {

                filterChain.doFilter(request, response);
                return;
            }

            // ========================================
            // ✅ GET AUTH HEADER
            // ========================================
            final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("⚠️ No Authorization header for: {}", path);
                filterChain.doFilter(request, response);
                return;
            }

            // ========================================
            // ✅ EXTRACT TOKEN
            // ========================================
            final String token = authHeader.substring(7).trim();

            if (token.isEmpty()) {
                log.warn("⚠️ Empty token");
                filterChain.doFilter(request, response);
                return;
            }

            // ========================================
            // 🔥 VALIDATE TOKEN
            // ========================================
            Claims claims = jwtUtil.validateTokenAndGetClaims(token);

            String username = claims.getSubject();
            String role = claims.get("role", String.class);

            log.info("🔍 JWT Username: {}", username);
            log.info("🔍 JWT Role: {}", role);

            if (username == null || role == null) {
                log.warn("⚠️ Missing username/role in token");
                filterChain.doFilter(request, response);
                return;
            }

            // ========================================
            // ✅ SET AUTHENTICATION
            // ========================================
            if (SecurityContextHolder.getContext().getAuthentication() == null) {

                String formattedRole =
                        role.startsWith("ROLE_") ? role : "ROLE_" + role;

                log.info("🔍 Authority set: {}", formattedRole);

                SimpleGrantedAuthority authority =
                        new SimpleGrantedAuthority(formattedRole);

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                                List.of(authority)
                        );

                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                SecurityContextHolder.getContext().setAuthentication(authToken);

                log.info("✅ Authenticated SUCCESS: {} | {}", username, formattedRole);
            }

        } catch (Exception ex) {
            log.error("❌ JWT processing error", ex);
            SecurityContextHolder.clearContext();
        }

        // ========================================
        // ✅ CONTINUE FILTER
        // ========================================
        filterChain.doFilter(request, response);
    }
}