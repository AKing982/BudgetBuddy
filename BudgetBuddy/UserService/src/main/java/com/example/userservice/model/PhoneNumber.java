package com.example.userservice.model;

import jakarta.persistence.Embeddable;
import lombok.Data;

import java.util.regex.Pattern;

@Data
@Embeddable
public class PhoneNumber
{
    private int countryCode;
    private int regionCode;
    private String number;

    private static final Pattern PHONE_NUMBER_PATTERN = Pattern.compile("\\d{7,10}$");

    public PhoneNumber(final int countryCode, final int regionCode, final String number){
        this.countryCode = countryCode;
        this.regionCode = regionCode;
        this.number = number;
    }

    private boolean isValidPhoneNumber(String phoneNumber){
        return PHONE_NUMBER_PATTERN.matcher(phoneNumber).matches();
    }

    public PhoneNumber(){

    }
}
