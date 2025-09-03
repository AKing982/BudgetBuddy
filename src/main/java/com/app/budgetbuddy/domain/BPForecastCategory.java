package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor(access= AccessLevel.PUBLIC)
public class BPForecastCategory
{
    private String category;
    private WeekNumber weekNumber;
    private double forecastedSpending;
    private double forecastedSavings;
    private double forecastedGoalsMet;

    public BPForecastCategory(String category, double spending, double savings, double goalsMet)
    {
        this.category = category;
        this.forecastedSpending = spending;
        this.forecastedSavings = savings;
        this.forecastedGoalsMet = goalsMet;
    }
}
