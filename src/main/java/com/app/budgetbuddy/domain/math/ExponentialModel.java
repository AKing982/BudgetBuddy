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
    private double a;
    private double b;

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
        this.parameters = new double[]{ a, b };
    }

    @Override
    public void fit(double[] x, double[] y)
    {
        if(x == null || y == null || x.length < 2 || x.length != y.length)
        {
            throw new IllegalArgumentException(
                    "Exponential fit requires at least 2 points with matching lengths");
        }
        // guard against log of zero or negative — exponential fit requires positive y values
        boolean hasNonPositive = Arrays.stream(y).anyMatch(v -> v <= 0);
        if(hasNonPositive)
        {
            throw new IllegalArgumentException(
                    "Exponential fit requires all y values to be positive — found zero or negative");
        }
        double[] lnY = Arrays.stream(y).map(Math::log).toArray();
        SimpleRegression regression = new SimpleRegression();
        for(int i = 0; i < x.length; i++)
        {
            regression.addData(x[i], lnY[i]);
        }
        this.b = regression.getSlope();
        this.a = Math.exp(regression.getIntercept());
        this.function = t -> a * Math.exp(b * t);
        this.parameters = new double[]{ a, b };
    }

    @Override
    public String equationString()
    {
        return String.format("y = %.3f * e^(%.3fx)", a, b);
    }
}
