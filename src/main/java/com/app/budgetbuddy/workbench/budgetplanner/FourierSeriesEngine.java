package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.math.FourierSeries;

public interface FourierSeriesEngine
{
    double getFourierSeriesPrediction(double t);

    double[] getFourierSeriesCoefficients();

    double getFourierSeriesFrequency(int index);

    FourierSeries getHarmonicComponent(int index);
}
