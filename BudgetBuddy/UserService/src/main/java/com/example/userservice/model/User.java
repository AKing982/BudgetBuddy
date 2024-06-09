package com.example.userservice.model;

import com.example.userservice.workbench.enums.Role;
import lombok.Data;

@Data
public class User
{
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private Address address;
    private PhoneNumber phoneNumber;
    private String userName;
    private Role role;
    private boolean isEnabled;

    public User(String firstName, String lastName, String email, String password, Address address, PhoneNumber phoneNumber, String userName, Role role, boolean isEnabled) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.address = address;
        this.phoneNumber = phoneNumber;
        this.userName = userName;
        this.role = role;
        this.isEnabled = isEnabled;
    }
}
