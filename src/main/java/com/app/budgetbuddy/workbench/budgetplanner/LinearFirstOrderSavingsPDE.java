package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.PdeType;
import com.app.budgetbuddy.domain.math.PartialDerivative;

import java.util.ArrayList;
import java.util.List;

public class LinearFirstOrderSavingsPDE implements MathematicalModelBuilder
{
    private List<PartialDerivative> partialDerivatives = new ArrayList<>();
    private final String dependentVariable = "S";
    private double t;
    private double alpha = 0.0;
    private double beta = 0.0;
    private double gamma = 0.0;

    @Override
    public void createModel(PdeType type)
    {
        this.partialDerivatives.clear();
        partialDerivatives.add(new PartialDerivative(dependentVariable, t, 1));
        partialDerivatives.add(new PartialDerivative(dependentVariable, ))
    }
}
