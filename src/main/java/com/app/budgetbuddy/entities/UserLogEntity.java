package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;
import org.jetbrains.annotations.NotNull;

import java.time.LocalDateTime;

@Entity
@Table(name="userLogs")
@Getter
@Setter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class UserLogEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="logId")
    private Long id;

    @NotNull
    @OneToOne
    @JoinColumn(name="userId")
    private UserEntity user;

    @Column(name="lastLogin")
    @NotNull
    private LocalDateTime lastLogin;

    @Column(name="lastLogout")
    @NotNull
    private LocalDateTime lastLogout;

    @Column(name="session_duration")
    private int sessionDuration;

    @Column(name="loginAttempts")
    private int loginAttempts;

    @Column(name="isActive")
    private boolean isActive;
}
