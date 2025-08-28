package com.app.budgetbuddy.domain.math;

import com.app.budgetbuddy.domain.ModelType;
import org.apache.commons.math3.analysis.UnivariateFunction;
import org.apache.commons.math3.ode.FirstOrderDifferentialEquations;
import org.apache.commons.math3.ode.FirstOrderIntegrator;
import org.apache.commons.math3.ode.nonstiff.ClassicalRungeKuttaIntegrator;

public class FirstOrderODEModel extends AbstractMathModel
{
    private FirstOrderDifferentialEquations ode;
    private FirstOrderIntegrator integrator;
    private double initialCondition;
    private double initialTime;
    private double stepSize;
    private String equationDescription;

    public FirstOrderODEModel()
    {
        super(ModelType.ODE);
        this.integrator = new ClassicalRungeKuttaIntegrator(0.01);
        this.stepSize = 0.01;
    }

    public FirstOrderODEModel(FirstOrderDifferentialEquations ode,
                              double initialTime,
                              double initialCondition)
    {
        super(ModelType.ODE);
        this.ode = ode;
        this.initialTime = initialTime;
        this.initialCondition = initialCondition;
        this.integrator = new ClassicalRungeKuttaIntegrator(0.01);
        this.stepSize = 0.01;

    }

    @Override
    public void fit(double[] x, double[] y) {

    }

    @Override
    public UnivariateFunction getFunction() {
        return null;
    }

    @Override
    public double[] getParameters() {
        return new double[0];
    }

    @Override
    public String getEquationString() {
        return "";
    }
}
