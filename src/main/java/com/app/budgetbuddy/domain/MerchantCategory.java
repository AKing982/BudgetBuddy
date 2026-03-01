package com.app.budgetbuddy.domain;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@EqualsAndHashCode
public class MerchantCategory
{
    private String merchant;
    private String category;
    private double amount;

    public MerchantCategory(String merchant, String category, double amount)
    {
        this.merchant = merchant;
        this.category = category;
        this.amount = amount;
    }

    public MerchantCategory(String merchant, String category)
    {
        this.merchant = merchant;
        this.category = category;
    }


}
