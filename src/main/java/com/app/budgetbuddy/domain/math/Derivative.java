package com.app.budgetbuddy.domain.math;

import lombok.Getter;
import lombok.Setter;

import java.util.function.Function;

@Getter
@Setter
public class Derivative
{
    private double x;
    private int n;

    public Derivative(double x, int n)
    {
        this.x = x;
        this.n = n;
    }

    public double evaluate(Function<Double, Double> f, double h)
    {
        return calculateDerivative(f, x, n, h);
    }

    public double calculateDerivative(Function<Double, Double> f, double x, int n, double h)
    {
        if(n == 0)
        {
            return f.apply(x);
        }
        return (calculateDerivative(f, x + h, n - 1, h) - calculateDerivative(f, x - h, n - 1, h)) /  (2 * h);
    }

    @Override
    public String toString()
    {
        return String.format("f^{(%d)}(%.5f)", n, x);
    }
}
