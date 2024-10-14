package com.app.budgetbuddy.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Registration
{
    private String firstName;
    private String lastName;
    private String email;
    private String username;
    private String password;
}
