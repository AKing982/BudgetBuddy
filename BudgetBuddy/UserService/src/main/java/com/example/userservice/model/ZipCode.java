package com.example.userservice.model;

import lombok.Data;

import java.util.regex.Pattern;

@Data
public class ZipCode
{
    private String zipCode;

    private static final Pattern ZIPCODE_PATTERN = Pattern.compile("^\\d{5}(-\\d{4})?$");

    public ZipCode(String zipCode) {
        if(!isValidZipCode(zipCode)) {
            throw new IllegalArgumentException("Invalid zip code format.");
        }
        this.zipCode = zipCode;
    }

    private boolean isValidZipCode(String zipCode) {
        return ZIPCODE_PATTERN.matcher(zipCode).matches();
    }

    @Override
    public String toString() {
        return zipCode;
    }
}
