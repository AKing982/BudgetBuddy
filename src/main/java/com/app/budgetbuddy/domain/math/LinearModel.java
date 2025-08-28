package com.app.budgetbuddy.domain.math;


import com.app.budgetbuddy.domain.ModelType;
import lombok.Getter;
import lombok.Setter;
import org.apache.commons.math3.analysis.UnivariateFunction;
import org.apache.commons.math3.stat.regression.SimpleRegression;

@Getter
@Setter
public class LinearModel extends AbstractMathModel
{
    private double slope;
    private double intercept;

    public LinearModel()
    {
        super(ModelType.LINEAR);
    }

    public LinearModel(double slope, double intercept)
    {
        super(ModelType.LINEAR);
        this.slope = slope;
        this.intercept = intercept;
        this.function = x -> slope * x + intercept;
        this.parameters = new double[] {slope, intercept};
    }

    @Override
    public void fit(double[] x, double[] y)
    {
        SimpleRegression regression = new SimpleRegression();
        for(int i = 0; i < x.length; i++)
        {
            regression.addData(x[i], y[i]);
        }
        this.slope = regression.getSlope();
        this.intercept = regression.getIntercept();
        this.function = t -> slope * t + intercept;
        this.parameters = new double[] {slope, intercept};
    }

    public double calculateSlope(double x1, double y1, double x2, double y2)
    {
        return (y2 - y1) / (x2 - x1);
    }

    public double calculateIntercept(double x1, double y1, double x2, double y2)
    {
        return y1 - calculateSlope(x1, y1, x2, y2) * x1;
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
    public String getEquationString()
    {
        return String.format("y = %.5fx + %.5f", slope, intercept);
    }

}
