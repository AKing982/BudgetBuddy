package com.app.budgetbuddy.domain.math;

import lombok.Getter;
import lombok.Setter;

import java.util.function.Function;

@Getter
@Setter
public class PartialDerivative
{
    private int index;
    private int n;

    public PartialDerivative(int index, int n)
    {
        this.index = index;
        this.n = n;
    }

    public PartialDerivative(int order)
    {
        this.n = order;
    }

    public double evaluate(Function<double[], Double> f, double[] vars, double h)
    {
        return computeNthPartial(f, vars, n, h, index);
    }

    public double computeNthPartial(Function<double[],Double> f, double[] vars, int n, double h, int varIndex)
    {
        if(n == 0)
        {
            return f.apply(vars);
        }
        double[] varsPlus = vars.clone();
        double[] varsMinus = vars.clone();
        varsPlus[varIndex] += h;
        varsMinus[varIndex] -= h;
        return (computeNthPartial(f, varsPlus, n - 1, h, varIndex) - computeNthPartial(f, varsMinus, n - 1, h, varIndex)) / (2 * h);
    }

    @Override
    public String toString() {
        return String.format("∂^%d f / ∂x%d^%d", n, index + 1);
    }
}
