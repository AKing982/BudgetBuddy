package com.app.budgetbuddy.domain.math;

import com.app.budgetbuddy.domain.ModelType;
import org.apache.commons.math3.analysis.UnivariateFunction;

public interface MathModel
{
    double evaluate(double x);
    ModelType modelType();
    double[] parameters();
    String equationString();
    UnivariateFunction toUnivariateFunction();

    default ModelFunction toModelFunction()
    {
        return new ModelFunction(modelType(), toUnivariateFunction(), parameters());
    }

    default boolean isFitted()
    {
        return parameters() != null && parameters().length > 0;
    }

    default void assertFitted()
    {
        if(!isFitted())
        {
            throw new IllegalStateException(
                    modelType() + " model has not been fitted — call fit() first");
        }
    }
}
