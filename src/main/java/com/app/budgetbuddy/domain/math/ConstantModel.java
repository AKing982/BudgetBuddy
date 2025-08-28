package com.app.budgetbuddy.domain.math;

import com.app.budgetbuddy.domain.ModelType;
import org.apache.commons.math3.analysis.UnivariateFunction;

import java.util.Arrays;

public class ConstantModel extends AbstractMathModel
{
    private double value;

    public ConstantModel(double value)
    {
        super(ModelType.CONSTANT);
        this.value = value;
        this.function = x -> value;
        this.parameters = new double[] {value};
    }

    public ConstantModel()
    {
        super(ModelType.CONSTANT);
        this.value = 0.0;
    }

    @Override
    public void fit(double[] x, double[] y)
    {
        this.value = Arrays.stream(y).average().orElse(0.0);
        this.function = t -> value;
        this.parameters = new double[] {value};
    }

    @Override
    public UnivariateFunction getFunction()
    {
        return function;
    }

    @Override
    public double[] getParameters()
    {
        return parameters;
    }

    @Override
    public String getEquationString()
    {
        return String.format("y = %.3f", value);
    }
}
