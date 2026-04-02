package com.project.config;

import com.project.security.JwtFilter;
import com.project.security.JwtUtil;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtUtil jwtUtil;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                // ❌ Disable CSRF
                .csrf(csrf -> csrf.disable())

                // 🌐 Enable CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // ❌ Stateless session
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // ❌ Disable default auth
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())

                // ⚠️ Custom error handling
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, ex1) -> {
                            res.setContentType("application/json");
                            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            res.getWriter().write("{\"error\":\"Unauthorized\"}");
                        })
                        .accessDeniedHandler((req, res, ex2) -> {
                            res.setContentType("application/json");
                            res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            res.getWriter().write("{\"error\":\"Access Denied\"}");
                        })
                )

                // =========================================
                // 🔓 AUTHORIZATION RULES (FIXED)
                // =========================================
                .authorizeHttpRequests(auth -> auth

                        // ✅ PUBLIC AUTH APIs
                        .requestMatchers("/api/auth/**").permitAll()

                        // ✅ 🔥 FIX: ALLOW CODE API
                        .requestMatchers(HttpMethod.GET, "/api/sessions/*/code").permitAll()

                        // (optional) allow session fetch
                        .requestMatchers(HttpMethod.GET, "/api/sessions/*").permitAll()

                        // 🔌 WebSocket
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/topic/**").permitAll()
                        .requestMatchers("/app/**").permitAll()

                        // ⚡ OPTIONS (CORS)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 👨‍🏫 Mentor only
                        .requestMatchers(HttpMethod.POST, "/api/sessions/create")
                        .hasRole("MENTOR")

                        // 👨‍🎓 Mentor + Student
                        .requestMatchers(HttpMethod.POST, "/api/sessions/join")
                        .hasAnyRole("MENTOR", "STUDENT")

                        // 🔒 Everything else secured
                        .anyRequest().authenticated()
                )

                // =========================================
                // 🔐 JWT FILTER
                // =========================================
                .addFilterBefore(
                        new JwtFilter(jwtUtil),
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    // =========================================
    // 🔑 PASSWORD ENCODER
    // =========================================
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // =========================================
    // 🌐 CORS CONFIG
    // =========================================
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }
}