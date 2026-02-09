package com.app.budgetbuddy.domain;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class EmailNotifications
{
    private Long notificationId;
    private Long userId;
    private String toEmail;
    private String fromEmail;
    private String subject;
    private String body;
    private LocalDate sendDate;
    private String type;
    private boolean isRead;
}
