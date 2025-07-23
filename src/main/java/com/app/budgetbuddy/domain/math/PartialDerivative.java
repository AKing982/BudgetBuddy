package com.app.budgetbuddy.domain.math;

import lombok.Getter;
import lombok.Setter;

import java.util.function.BiFunction;

@Getter
@Setter
public class PartialDerivative
{
    private String equation;
    private double x;
    private double t;
    private int n;

    public PartialDerivative(double x, double t, int n)
    {
        this.x = x;
        this.t = t;
        this.n = n;
    }

    public PartialDerivative(double t, int n)
    {
        this.t = t;
        this.n = n;
    }

    public PartialDerivative(int order)
    {
        this.n = order;
    }

    public BiFunction<Double, Double, Double> withRespectToX(BiFunction<Double, Double, Double> f, double h)
    {
        return (x,t) -> computeNthPartial(f, x, t, n, h, true);
    }

    public BiFunction<Double, Double, Double> withRespectToT(BiFunction<Double, Double, Double> f, double h)
    {
        return (x,t) -> computeNthPartial(f, x, t, n, h, false);
    }

    public double evaluateAtX(BiFunction<Double, Double, Double> f, double x, double t, double h)
    {
        return computeNthPartial(f, x, t, n, h, true);
    }

    public double evaluateAtY(BiFunction<Double, Double, Double> f, double x, double t, double h)
    {
        return computeNthPartial(f, x, t, n, h, false);
    }

    public double computeNthPartial(BiFunction<Double, Double, Double> f, double x, double t, int n, double h, boolean withRespectToX)
    {
        if(n == 0)
        {
            return f.apply(x, t);
        }
        if(withRespectToX)
        {
            return (computeNthPartial(f, x + h, t, n - 1, h, true) - computeNthPartial(f, x - h, t, n - 1, h, true)) / (2 * h);
        }
        return (computeNthPartial(f, x, t + h, n - 1, h, false) - computeNthPartial(f, x, t - h, n - 1, h, false)) / (2 * h);
    }

    @Override
    public String toString()
    {
        String derivativeX = String.format("∂^%d f / ∂x^%d at (x=%.5f, t=%.5f)", n, n, x, t);
        String derivativeT = String.format("∂^%d f / ∂t^%d at (x=%.5f, t=%.5f)", n, n, x, t);
        return derivativeX + "\n" + derivativeT;
    }
}
