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
        this.parameters = new double[] {a, b, c};
    }

    @Override
    public void fit(double[] x, double[] y)
    {
        PolynomialCurveFitter polynomialCurveFitter = PolynomialCurveFitter.create(2);
        WeightedObservedPoints obs = new WeightedObservedPoints();
        for(int i = 0; i < x.length; i++)
        {
            obs.add(x[i], y[i]);
        }
        double[] coeffs = polynomialCurveFitter.fit(obs.toList());
        this.a = coeffs[0];
        this.b = coeffs[1];
        this.c = coeffs[2];
        this.function = t -> a * t * t + b * t + c;
        this.parameters = new double[] {a, b, c};
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
    public String getEquationString() {
        return String.format("y = %.3fx² + %.3fx + %.3f", a, b, c);
    }
}
