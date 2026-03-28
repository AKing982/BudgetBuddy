package com.app.budgetbuddy.domain.math;

import com.app.budgetbuddy.domain.ModelType;
import lombok.Getter;
import org.apache.commons.math3.analysis.UnivariateFunction;

import java.util.Arrays;

@Getter
public class ConstantModel extends AbstractMathModel
{
    private double constant;

    public ConstantModel()
    {
        super(ModelType.CONSTANT);
    }

    public ConstantModel(double constant)
    {
        super(ModelType.CONSTANT);
        this.constant = constant;
        this.function = x -> constant;
        this.parameters = new double[]{ constant };
    }

    @Override
    public void fit(double[] x, double[] y)
    {
        if(y == null || y.length == 0)
        {
            throw new IllegalArgumentException("Constant fit requires at least 1 point");
        }
        this.constant = Arrays.stream(y).average().orElse(0.0);
        this.function = ignored -> constant;
        this.parameters = new double[]{ constant };
    }

    @Override
    public String equationString()
    {
        return String.format("y = %.4f", constant);
    }
}
