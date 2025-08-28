package com.app.budgetbuddy.domain.math;

import com.app.budgetbuddy.domain.ModelType;
import com.app.budgetbuddy.domain.WeekNumber;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.apache.commons.math3.analysis.UnivariateFunction;

import java.math.BigDecimal;

@NoArgsConstructor(access= AccessLevel.PUBLIC, force = true)
public abstract class AbstractMathModel
{
    protected final ModelType modelType;
    protected UnivariateFunction function;
    protected double[] parameters;

    protected AbstractMathModel(ModelType type)
    {
        this.modelType = type;
    }

    public abstract void fit(double[] x, double[] y);
    public abstract UnivariateFunction getFunction();
    public abstract double[] getParameters();
    public abstract String getEquationString();

    public double evaluate(double x)
    {
        return function.value(x);
    }

    public ModelFunction toModelFunction()
    {
        return new ModelFunction(modelType, function, parameters);
    }
}
