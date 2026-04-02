
package com.project.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Session {
  @Id
  private String id;

  private String mentorId;
  private String studentId;
  private String status; // CREATED, ACTIVE, ENDED
}
