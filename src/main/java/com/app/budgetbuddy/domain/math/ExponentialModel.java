package com.app.budgetbuddy.domain.math;

import com.app.budgetbuddy.domain.ModelType;
import lombok.Getter;
import lombok.Setter;
import org.apache.commons.math3.analysis.UnivariateFunction;
import org.apache.commons.math3.stat.regression.SimpleRegression;

import java.util.Arrays;

@Getter
@Setter
public class ExponentialModel extends AbstractMathModel
{
    private double a, b;

    public ExponentialModel()
    {
        super(ModelType.EXPONENTIAL);
    }

    public ExponentialModel(double a, double b)
    {
        super(ModelType.EXPONENTIAL);
        this.a = a;
        this.b = b;
        this.function = x -> a * Math.exp(b * x);
        this.parameters = new double[] {a, b};
    }

    @Override
    public void fit(double[] x, double[] y)
    {
        double[] lnY = Arrays.stream(y).map(Math::log).toArray();
        SimpleRegression regression = new SimpleRegression();
        for(int i = 0; i < x.length; i++)
        {
            regression.addData(x[i], lnY[i]);
        }
        this.b = regression.getSlope();
        this.a = Math.exp(regression.getIntercept());
        this.function = t -> a * Math.exp(b * t);
        this.parameters = new double[] {a, b};
    }

    @Override
    public UnivariateFunction getFunction()
    {
        return this.function;
    }

    @Override
    public double[] getParameters()
    {
        return parameters;
    }

    @Override
    public String getEquationString()
    {
        return String.format("y = %.3f * e^(%.3fx)", a, b);
    }
}
