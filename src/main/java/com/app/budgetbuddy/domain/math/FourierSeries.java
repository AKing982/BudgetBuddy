package com.app.budgetbuddy.domain.math;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FourierSeries
{
    private double a0;
    private double[] a;
    private double[] b;
    private int N;
    private double[] x;

    public FourierSeries(double[] x)
    {
        this.x = x;
        this.N = x.length;
        this.a = new double[N / 2];
        this.b = new double[N / 2];
        this.computeCoefficients();
    }

    public void computeCoefficients()
    {
        for(double v : x)
        {
            a0 += v;
        }
        a0 /= N;
        for(int k = 1; k < N / 2; k++)
        {
            for(int n = 0; n < N; n++)
            {
                a[k] += x[n] * Math.cos(2 * Math.PI * k * n / N);
                b[k] += x[n] * Math.sin(2 * Math.PI * k * n / N);
            }
            a[k] *= 2.0 / N;
            b[k] *= -2.0 / N;
        }
    }

    public double predict(int t)
    {
        double xt = a0;
        for(int k = 1; k < N / 2; k++)
        {
            xt += a[k] * Math.cos(2 * Math.PI * k * t / N) + b[k] * Math.sin(2 * Math.PI * k * t / N);
        }
        return xt;
    }

}
