package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Objects;

@Getter
@Setter
public class MerchantPrice
{
    private String merchantName;
    private BigDecimal price;

    public MerchantPrice(String merchantName, BigDecimal price)
    {
        this.merchantName = merchantName;
        this.price = price;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        MerchantPrice that = (MerchantPrice) o;
        return Objects.equals(merchantName, that.merchantName) && Objects.equals(price, that.price);
    }

    @Override
    public int hashCode() {
        return Objects.hash(merchantName, price);
    }
}
