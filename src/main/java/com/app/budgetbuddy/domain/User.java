package com.app.budgetbuddy.domain;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class User
{
    private int id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String username;
    private String password;

    public User(int id, String firstName, String lastName, String email, String phone, String username, String password) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.username = username;
        this.password = password;
    }
}
