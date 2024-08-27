package com.app.budgetbuddy.domain;

import lombok.Data;

import java.util.Objects;

@Data
public class ExchangeResponse
{
    private String accessToken;
    private String itemID;
    private Long userID;

    public ExchangeResponse(String accessToken, String itemID, Long userID)
    {
        this.accessToken = accessToken;
        this.itemID = itemID;
        this.userID = userID;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ExchangeResponse that = (ExchangeResponse) o;
        return Objects.equals(accessToken, that.accessToken) && Objects.equals(itemID, that.itemID) && Objects.equals(userID, that.userID);
    }

    @Override
    public int hashCode() {
        return Objects.hash(accessToken, itemID, userID);
    }
}
