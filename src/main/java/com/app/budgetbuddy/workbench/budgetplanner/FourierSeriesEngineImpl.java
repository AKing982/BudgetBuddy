package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.math.FourierSeries;
import com.app.budgetbuddy.services.BudgetCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;


/**
 *
 */
@Service
public class FourierSeriesEngineImpl implements FourierSeriesEngine
{
    private final List<FourierSeries> fourierSeriesList = new ArrayList<>();
    private final BudgetCategoryService budgetCategoryService;

    @Autowired
    public FourierSeriesEngineImpl(BudgetCategoryService budgetCategoryService)
    {
        this.budgetCategoryService = budgetCategoryService;
    }

    public FourierSeries build(double[] a)
    {
        return null;
    }

    @Override
    public double getFourierSeriesPrediction(double t)
    {
        return 0;
    }

    @Override
    public double[] getFourierSeriesCoefficients()
    {
        return new double[0];
    }

    @Override
    public double getFourierSeriesFrequency(int index)
    {
        return 0;
    }

    @Override
    public FourierSeries getHarmonicComponent(int index)
    {
        return null;
    }
}
