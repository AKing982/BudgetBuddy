package com.app.budgetbuddy.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import retrofit2.http.GET;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PlaidLinkTokenResponse
{
    private String linkToken;
}
