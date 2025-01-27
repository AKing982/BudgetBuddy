package com.app.budgetbuddy.domain;

import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.YearMonth;

@Data
public class BudgetMonth
{
    private YearMonth yearMonth;

    public BudgetMonth(YearMonth yearMonth)
    {
        this.yearMonth = yearMonth;
    }
}
