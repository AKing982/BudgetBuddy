package com.app.budgetbuddy.domain.math;

import com.app.budgetbuddy.domain.ModelType;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.apache.commons.math3.analysis.UnivariateFunction;
import org.apache.commons.math3.analysis.polynomials.PolynomialFunction;
import org.apache.commons.math3.fitting.PolynomialCurveFitter;
import org.apache.commons.math3.fitting.WeightedObservedPoints;


public class PolynomialModel extends AbstractMathModel
{
    private double[] coefficients;
    private int degree;

    public PolynomialModel(int degree) {
        super(ModelType.POLYNOMIAL);
        this.degree = degree;
    }

    public PolynomialModel(){
        super(ModelType.POLYNOMIAL);
        this.degree = 3;
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
    public void fit(double[] x, double[] y) {
        PolynomialCurveFitter fitter = PolynomialCurveFitter.create(degree);
        WeightedObservedPoints obs = new WeightedObservedPoints();
        for (int i = 0; i < x.length; i++) {
            obs.add(x[i], y[i]);
        }
        this.coefficients = fitter.fit(obs.toList());
        this.function = new PolynomialFunction(coefficients);
        this.parameters = coefficients.clone();
    }

    @Override
    public UnivariateFunction getFunction() {
        return function;
    }

    @Override
    public double[] getParameters() {
        return parameters;
    }

    @Override
    public String getEquationString()
    {
       StringBuilder sb = new StringBuilder("y = ");
        for (int i = coefficients.length - 1; i >= 0; i--) {
            if (i == coefficients.length - 1) {
                sb.append(String.format("%.3fx^%d", coefficients[i], i));
            } else if (i > 0) {
                sb.append(String.format(" + %.3fx^%d", coefficients[i], i));
            } else {
                sb.append(String.format(" + %.3f", coefficients[i]));
            }
        }
        return sb.toString();
    }
}
