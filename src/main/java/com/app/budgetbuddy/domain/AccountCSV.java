package com.app.budgetbuddy.domain;

import lombok.*;
import org.jetbrains.annotations.NotNull;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor(access= AccessLevel.PUBLIC)
@NoArgsConstructor(access= AccessLevel.PUBLIC)
public class AccountCSV implements Comparable<AccountCSV>
{
    private Long id;
    private Long userId;
    private String accountNumber;
    private int suffix;
    private String accountName;
    private BigDecimal balance;

    @Override
    public int compareTo(@NotNull AccountCSV o) {
        return this.accountNumber.compareTo(o.accountNumber);
    }
}
