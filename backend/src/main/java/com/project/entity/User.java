package com.project.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")  // ✅ safe table name
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)  // ✅ UUID ID
    private String id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role; // MENTOR / STUDENT

    // 🔥 IMPORTANT: token field (NOT stored in DB)
    @Transient
    private String token;
}