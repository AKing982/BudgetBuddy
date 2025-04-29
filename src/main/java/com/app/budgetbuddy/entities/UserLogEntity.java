package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.jetbrains.annotations.NotNull;

import java.time.LocalDateTime;

@Entity
@Table(name="userLogs")
@Getter
@Setter
public class UserLogEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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

    @Column(name="sessionDuration")
    private int sessionDuration;

    @Column(name="loginAttempts")
    private int loginAttempts;

    @Column(name="isActive")
    private boolean isActive;
}
