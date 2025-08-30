package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor(access= AccessLevel.PUBLIC)
@Getter
@Setter
public class CategoryCoordinates
{
    private int x_week_number;
    private String category;
    private double y_weekly_spending;
    private double z_weekly_saved;
    private double w_weekly_goal_met;

    public CategoryCoordinates(String category, int weekNumber, double weeklySpending, double weeklySaved, double weeklyGoalMet)
    {
        this.category = category;
        this.x_week_number = weekNumber;
        this.y_weekly_spending = weeklySpending;
        this.z_weekly_saved = weeklySaved;
        this.w_weekly_goal_met = weeklyGoalMet;
    }
}
