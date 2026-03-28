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
        this.parameters = new double[]{ slope, intercept };
    }

    @Override
    public void fit(double[] x, double[] y)
    {
        if(x.length < 2 || x.length != y.length)
        {
            throw new IllegalArgumentException("Linear fit requires at least 2 points");
        }
        SimpleRegression regression = new SimpleRegression();
        for(int i = 0; i < x.length; i++)
        {
            regression.addData(x[i], y[i]);
        }
        this.slope = regression.getSlope();
        this.intercept = regression.getIntercept();
        this.function = t -> slope * t + intercept;
        this.parameters = new double[]{ slope, intercept };
    }

    @Override
    public String equationString()
    {
        return String.format("y = %.5fx + %.5f", slope, intercept);
    }

}
