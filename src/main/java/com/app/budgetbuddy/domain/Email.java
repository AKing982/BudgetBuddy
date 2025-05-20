package com.app.budgetbuddy.domain;

import lombok.*;

import java.awt.desktop.AboutEvent;

@Getter
@Setter
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class Email
{
    private String toEmail;
    private String fromEmail;
    private String subject;
    private String body;
}
