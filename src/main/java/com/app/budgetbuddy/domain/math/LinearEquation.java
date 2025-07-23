package com.app.budgetbuddy.domain.math;

public class LinearEquation
{
    private double m;
    private double x;
    private double b;

    public LinearEquation(double m, double x, double b)
    {
        this.m = m;
        this.x = x;
        this.b = b;
    }

    public double getLinearEquation()
    {
        if(b == 0)
        {
            return m * x;
        }
        return m * x + b;
    }
}
