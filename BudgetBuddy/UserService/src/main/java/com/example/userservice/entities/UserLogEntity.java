package com.example.userservice.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Table(name="userLogs")
@Entity
@Data
public class UserLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name="userID", nullable = false)
    private UserEntity user;

    @Column(name="isActive")
    private boolean isActive;

    @Column(name="lastLoginTime", nullable = false)
    private LocalDateTime lastLoginTime;

    @Column(name="lastLogoutTime", nullable = false)
    private LocalDateTime lastLogoutTime;

    @Column(name="loginAttempts")
    private Integer loginAttempts;

    @Column(name="duration")
    private Long duration;

    public UserLogEntity(Long id, UserEntity user, boolean isActive, LocalDateTime lastLoginTime, LocalDateTime lastLogoutTime, Integer loginAttempts, Long duration) {
        this.id = id;
        this.user = user;
        this.isActive = isActive;
        this.lastLoginTime = lastLoginTime;
        this.lastLogoutTime = lastLogoutTime;
        this.loginAttempts = loginAttempts;
        this.duration = duration;
    }

    public UserLogEntity(){

    }
}
