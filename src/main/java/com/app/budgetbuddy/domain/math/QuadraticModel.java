package com.app.budgetbuddy.domain.math;

import com.app.budgetbuddy.domain.ModelType;
import org.apache.commons.math3.analysis.UnivariateFunction;
import org.apache.commons.math3.fitting.PolynomialCurveFitter;
import org.apache.commons.math3.fitting.WeightedObservedPoints;

public class QuadraticModel extends AbstractMathModel
{
    private double a, b, c;

    public QuadraticModel()
    {
        super(ModelType.QUADRATIC);
    }

    public QuadraticModel(double a, double b, double c)
    {
        super(ModelType.QUADRATIC);
        this.a = a;
        this.b = b;
        this.c = c;
        this.function = x -> a * x * x + b * x + c;
        this.parameters = new double[]{ a, b, c };
    }

    @Override
    public void fit(double[] x, double[] y)
    {
        if(x.length < 3 || x.length != y.length)
        {
            throw new IllegalArgumentException("Quadratic fit requires at least 3 points");
        }
        PolynomialCurveFitter fitter = PolynomialCurveFitter.create(2);
        WeightedObservedPoints obs = new WeightedObservedPoints();
        for(int i = 0; i < x.length; i++)
        {
            obs.add(x[i], y[i]);
        }
        double[] coeffs = fitter.fit(obs.toList());
        this.c = coeffs[0];
        this.b = coeffs[1];
        this.a = coeffs[2];
        this.function = t -> a * t * t + b * t + c;
        this.parameters = new double[]{ a, b, c };
    }

    @Override
    public String equationString()
    {
        return String.format("y = %.3fx² + %.3fx + %.3f", a, b, c);
    }
}
