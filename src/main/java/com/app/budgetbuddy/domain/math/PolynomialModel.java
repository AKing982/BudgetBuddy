package com.app.budgetbuddy.domain.math;

import com.app.budgetbuddy.domain.ModelType;
import org.apache.commons.math3.analysis.UnivariateFunction;
import org.apache.commons.math3.analysis.polynomials.PolynomialFunction;
import org.apache.commons.math3.fitting.PolynomialCurveFitter;
import org.apache.commons.math3.fitting.WeightedObservedPoints;


public class PolynomialModel extends AbstractMathModel
{
    private double[] coefficients;
    private int degree;

    public PolynomialModel()
    {
        super(ModelType.POLYNOMIAL);
        this.degree = 3;
    }

    public PolynomialModel(int degree)
    {
        super(ModelType.POLYNOMIAL);
        if(degree < 1)
        {
            throw new IllegalArgumentException("Degree must be at least 1");
        }
        this.degree = degree;
    }

    public PolynomialModel(double[] coefficients)
    {
        super(ModelType.POLYNOMIAL);
        this.coefficients = coefficients;
        this.degree = coefficients.length - 1;
        this.function = new PolynomialFunction(coefficients);
        this.parameters = coefficients.clone();
    }

    @Override
    public void fit(double[] x, double[] y)
    {
        if(x.length < degree + 1 || x.length != y.length)
        {
            throw new IllegalArgumentException(
                    "Polynomial degree " + degree + " fit requires at least " + (degree + 1) + " points");
        }
        PolynomialCurveFitter fitter = PolynomialCurveFitter.create(degree);
        WeightedObservedPoints obs = new WeightedObservedPoints();
        for(int i = 0; i < x.length; i++)
        {
            obs.add(x[i], y[i]);
        }
        this.coefficients = fitter.fit(obs.toList());
        this.function = new PolynomialFunction(coefficients);
        this.parameters = coefficients.clone();
    }

    @Override
    public String equationString()
    {
        StringBuilder sb = new StringBuilder("y = ");
        for(int i = coefficients.length - 1; i >= 0; i--)
        {
            if(i == coefficients.length - 1)
            {
                sb.append(String.format("%.3fx^%d", coefficients[i], i));
            }
            else if(i > 0)
            {
                sb.append(String.format(" + %.3fx^%d", coefficients[i], i));
            }
            else
            {
                sb.append(String.format(" + %.3f", coefficients[i]));
            }
        }
        return sb.toString();
    }
}
