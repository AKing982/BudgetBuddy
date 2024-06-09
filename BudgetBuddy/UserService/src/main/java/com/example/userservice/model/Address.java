package com.example.userservice.model;

import lombok.Data;

@Data
public class Address
{
    private String street;
    private String city;
    private String state;
    private ZipCode ZIP;
    private String country;

    public Address(String street, String city, String state, ZipCode ZIP, String country) {
        this.street = street;
        this.city = city;
        this.state = state;
        this.ZIP = ZIP;
        this.country = country;
    }

    @Override
    public String toString() {
        return String.format("%s %s %s %s %s", street, city, state, ZIP, country);
    }
}
