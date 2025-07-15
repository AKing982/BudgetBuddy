package com.app.budgetbuddy.domain.math;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Vector2D
{
    private double x;
    private double y;

    public Vector2D(double x, double y)
    {
        this.x = x;
        this.y = y;
    }

    public double calculateMagnitude()
    {
        return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    }
}
