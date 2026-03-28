package com.app.budgetbuddy.domain.math;

import com.app.budgetbuddy.domain.ModelType;
import com.app.budgetbuddy.domain.WeekNumber;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.apache.commons.math3.analysis.UnivariateFunction;

import java.math.BigDecimal;

@NoArgsConstructor(access= AccessLevel.PUBLIC, force = true)
public abstract class AbstractMathModel implements MathModel
{
    protected final ModelType modelType;
    protected UnivariateFunction function;
    protected double[] parameters;

    protected AbstractMathModel(ModelType modelType)
    {
        if(modelType == null)
        {
            throw new IllegalArgumentException("ModelType is required");
        }
        this.modelType = modelType;
    }

    public abstract void fit(double[] x, double[] y);

    @Override
    public double evaluate(double x)
    {
        assertFitted();
        return function.value(x);
    }

    @Override
    public ModelType modelType()
    {
        return modelType;
    }

    @Override
    public double[] parameters()
    {
        return parameters;
    }

    @Override
    public UnivariateFunction toUnivariateFunction()
    {
        assertFitted();
        return function;
    }

    @Override
    public ModelFunction toModelFunction()
    {
        assertFitted();
        return new ModelFunction(modelType, function, parameters);
    }
}
