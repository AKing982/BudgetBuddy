package com.example.userservice.entities;

import com.example.userservice.embeddable.Address;
import jakarta.persistence.*;
import lombok.Data;

@Table(name="users")
@Entity
@Data
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username")
    private String username;

    @Column(name="email")
    private String email;

    @Column(name="password")
    private String password;

    @Embedded
    private Address address;

    @Column(name="phone_number")
    @Embedded
    private PhoneNumber phoneNumber;


}
