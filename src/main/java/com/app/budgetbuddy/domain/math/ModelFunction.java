package com.app.budgetbuddy.domain.math;

import com.app.budgetbuddy.domain.ModelType;
import lombok.Getter;
import lombok.Setter;
import org.apache.commons.math3.analysis.UnivariateFunction;

@Getter
@Setter
public class ModelFunction
{
    private ModelType modelType;
    private UnivariateFunction univariateFunction;
    private double[] parameters;

    public ModelFunction(ModelType modelType, UnivariateFunction univariateFunction, double[] parameters)
    {
        this.modelType = modelType;
        this.univariateFunction = univariateFunction;
        this.parameters = parameters;
    }

    public double evaluate(double x)
    {
        return univariateFunction.value(x);
    }
}
