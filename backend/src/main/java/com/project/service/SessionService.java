package com.project.service;

import com.project.entity.Session;
import com.project.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {

    private final SessionRepository repo;

    // ========================================
    // ✅ CREATE SESSION (Mentor only)
    // ========================================
    public Session create(String mentorEmail) {

        if (mentorEmail == null || mentorEmail.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid mentor email"
            );
        }

        Session session = new Session();

        session.setId(UUID.randomUUID().toString());
        session.setMentorId(mentorEmail);
        session.setStatus("CREATED");

        log.info("🆕 Session created | ID: {} | Mentor: {}", session.getId(), mentorEmail);

        return repo.save(session);
    }

    // ========================================
    // ✅ JOIN SESSION (Student only)
    // ========================================
    @Transactional
    public Session join(String sessionId, String studentEmail) {

        if (sessionId == null || sessionId.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid session ID"
            );
        }

        if (studentEmail == null || studentEmail.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid student email"
            );
        }

        Session session = repo.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Session not found"
                ));

        // ❌ Prevent joining ended session
        if ("ENDED".equals(session.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Session already ended"
            );
        }

        // ❌ Prevent multiple students (race-condition safe)
        if (session.getStudentId() != null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Session already has a student"
            );
        }

        session.setStudentId(studentEmail);
        session.setStatus("ACTIVE");

        log.info("👨‍🎓 Student joined | Session: {} | Student: {}", sessionId, studentEmail);

        return repo.save(session);
    }

    // ========================================
    // ✅ GET SESSION DETAILS
    // ========================================
    public Session getSession(String sessionId) {

        if (sessionId == null || sessionId.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid session ID"
            );
        }

        return repo.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Session not found"
                ));
    }

    // ========================================
    // ✅ END SESSION (Mentor only)
    // ========================================
    @Transactional
    public Session endSession(String sessionId, String mentorEmail) {

        if (sessionId == null || sessionId.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid session ID"
            );
        }

        if (mentorEmail == null || mentorEmail.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid mentor email"
            );
        }

        Session session = repo.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Session not found"
                ));

        // ❌ Only mentor can end session
        if (!mentorEmail.equals(session.getMentorId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only mentor can end session"
            );
        }

        // ❌ Already ended
        if ("ENDED".equals(session.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Session already ended"
            );
        }

        session.setStatus("ENDED");

        log.info("🛑 Session ended | ID: {} | Mentor: {}", sessionId, mentorEmail);

        return repo.save(session);
    }
}