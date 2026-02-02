package com.app.budgetbuddy.domain;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class ReceiptItem
{
    private Long id;
    private String name;
    private int quantity;
    private double price;
    private double totalPrice;
}
