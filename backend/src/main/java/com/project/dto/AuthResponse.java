package com.project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor   // ✅ supports (token, email, role)
@NoArgsConstructor    // ✅ required for Jackson
public class AuthResponse {

    private String token;
    private String email;
    private String role;
}