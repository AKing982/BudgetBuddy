package com.app.budgetbuddy.domain.math;

import com.app.budgetbuddy.domain.ModelType;
import lombok.Getter;
import lombok.Setter;
import org.apache.commons.math3.analysis.UnivariateFunction;
import org.apache.commons.math3.complex.Complex;
import org.apache.commons.math3.transform.DftNormalization;
import org.apache.commons.math3.transform.FastFourierTransformer;
import org.apache.commons.math3.transform.TransformType;

import java.util.Arrays;

@Getter
@Setter
public class FourierSeries extends AbstractMathModel
{
    private double a0;
    private double[] a;
    private double[] b;
    private int N;
    private double[] x;
    private double sampleRate;

    public FourierSeries()
    {
        super(ModelType.FOURIER);
    }

    public FourierSeries(double[] x)
    {
        super(ModelType.FOURIER);
        this.x = x;
        this.N = x.length;
        this.a = new double[N / 2];
        this.b = new double[N / 2];
        this.computeCoefficients();
    }

    public void computeCoefficients()
    {
        FastFourierTransformer fft = new FastFourierTransformer(DftNormalization.STANDARD);
        Complex[] result = fft.transform(x, TransformType.FORWARD);

        // DC term (a0)
        a0 = result[0].getReal() / N;

        Arrays.fill(a, 0.0);
        Arrays.fill(b, 0.0);

        for (int k = 1; k < N / 2; k++) {
            // Scale so coefficients match the real Fourier series definition
            a[k] = (2.0 / N) * result[k].getReal();
            b[k] = (-2.0 / N) * result[k].getImaginary(); // minus sign from convention
        }
    }

    public double[][] getFourierSeriesCoefficients()
    {
        return new double[][]{ a.clone(), b.clone() };
    }

    public double predict(int t)
    {
        double xt = a0;
        for (int k = 1; k < N / 2; k++)
        {
            xt += a[k] * Math.cos(2 * Math.PI * k * t / N)
                    + b[k] * Math.sin(2 * Math.PI * k * t / N);
        }
        return xt;
    }

    @Override
    public void fit(double[] x, double[] y)
    {
        if(x.length != y.length)
        {
            throw new IllegalArgumentException("x and y must be the same length");
        }
        this.N = y.length;
        this.x = x.clone();
        double dt = x[1] - x[0];
        for(int i = 2; i < x.length; i++)
        {
            double diff = x[i] - x[i - 1];
            if(Math.abs(diff - dt) > 1e-9)
            {
                throw new IllegalArgumentException("x must be equally spaced");
            }
        }
        this.sampleRate = 1.0 / dt;
        this.computeCoefficients();
    }

    @Override
    public UnivariateFunction getFunction()
    {
        return t -> predict((int) t);
    }

    @Override
    public double[] getParameters()
    {
        double[] params = new double[1 + a.length + b.length];
        params[0] = a0;
        System.arraycopy(a, 0, params, 1, a.length);
        System.arraycopy(b, 0, params, 1 + a.length, b.length);
        return params;
    }

    @Override
    public String getEquationString()
    {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("%.4f", a0));
        for (int k = 1; k < N / 2; k++) {
            sb.append(String.format(" + %.4f*cos(2π*%d*t/T) + %.4f*sin(2π*%d*t/T)",
                    a[k], k, b[k], k));
        }
        return sb.toString();
    }
}
