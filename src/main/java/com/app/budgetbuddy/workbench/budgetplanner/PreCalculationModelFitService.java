package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.ModelType;
import com.app.budgetbuddy.domain.PositionType;
import com.app.budgetbuddy.domain.math.*;
import com.app.budgetbuddy.exceptions.InvalidCoordinateLengthException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Supplier;

import static com.app.budgetbuddy.domain.ModelType.*;

@Service
@Slf4j
public class PreCalculationModelFitService
{
    public Map<PositionType, List<MathModel>> fitModels(
            final double[] x,
            final double[] y,
            final double[] z,
            final double[] w)
    {
        if(x.length == 0 || y.length == 0 || z.length == 0 || w.length == 0)
        {
            return Collections.emptyMap();
        }
        if(x.length != y.length || x.length != z.length || x.length != w.length)
        {
            throw new InvalidCoordinateLengthException(
                    "Coordinate lengths do not match — x:" + x.length +
                            " y:" + y.length + " z:" + z.length + " w:" + w.length);
        }
        Map<PositionType, List<MathModel>> models = new HashMap<>();
        models.put(PositionType.SPENDING,  new ArrayList<>());
        models.put(PositionType.LEFT_OVER, new ArrayList<>());
        models.put(PositionType.GOALS_MET, new ArrayList<>());

        // constant — when values don't change (FIXED_EXPENSE)
        if(hasConstantValues(y) || hasConstantValues(z) || hasConstantValues(w))
        {
            fitAndAdd(models, ConstantModel::new, x, y, z, w);
        }
        // linear — 2+ points with increasing/decreasing trend
        if(x.length >= 2 &&
                (hasIncreasingOrDecreasing(y) ||
                        hasIncreasingOrDecreasing(z) ||
                        hasIncreasingOrDecreasing(w)))
        {
            fitAndAdd(models, LinearModel::new, x, y, z, w);
        }
        // quadratic — 3+ points
        if(x.length >= 3)
        {
            fitAndAdd(models, QuadraticModel::new, x, y, z, w);
        }
        // polynomial — 4+ points
        if(x.length >= 4)
        {
            fitAndAdd(models, PolynomialModel::new, x, y, z, w);
        }
        // exponential — 5+ points, only if data shape warrants it
        if(x.length >= 5)
        {
            if(looksExponential(x, y)) fitAndAddSingle(models, PositionType.SPENDING,  new ExponentialModel(), x, y);
            if(looksExponential(x, z)) fitAndAddSingle(models, PositionType.LEFT_OVER, new ExponentialModel(), x, z);
            if(looksExponential(x, w)) fitAndAddSingle(models, PositionType.GOALS_MET, new ExponentialModel(), x, w);
        }
        return models;
    }

    public Map<PositionType, MathModel> selectBestModels(
            final Map<PositionType, List<MathModel>> models)
    {
//        if(models == null || models.isEmpty())
//        {
//            return Collections.emptyMap();
//        }
//        Map<PositionType, MathModel> bestModels = new HashMap<>();
//        for(Map.Entry<PositionType, List<MathModel>> entry : models.entrySet())
//        {
//            PositionType positionType = entry.getKey();
//            List<MathModel> candidates = entry.getValue();
//            if(candidates.isEmpty())
//            {
//                continue;
//            }
//            if(candidates.size() == 1)
//            {
//                bestModels.put(positionType, candidates.get(0));
//                continue;
//            }
//            MathModel best = null;
//            double bestScore = 0.0;
//            for(int i = 0; i < candidates.size() - 1; i++)
//            {
//                MathModel current = candidates.get(i);
//                MathModel next = candidates.get(i + 1);
//                if(current == null)
//                {
//                    throw new InvalidMathModelException(
//                            "Null model at index " + i + " for position: " + positionType);
//                }
//                int currentParams = getNumberOfParameters(current.modelType());
//                int nextParams    = getNumberOfParameters(next.modelType());
//                double rSquared = calculateRSquared(
//                        current,
//                        current.parameters(),
//                        next.parameters());
//                double adjustedRSquared = adjustForOverfitting(rSquared, currentParams, nextParams);
//                if(adjustedRSquared > bestScore)
//                {
//                    bestScore = adjustedRSquared;
//                    best = current;
//                }
//                if(adjustedRSquared > 0.9)
//                {
//                    log.debug("Overfitting detected for: {} rSquared: {}", current.modelType(), rSquared);
//                }
//            }
//            bestModels.put(positionType, best);
//        }
//        return bestModels;
        return null;
    }

    public boolean looksExponential(final double[] x, final double[] y)
    {
        if(x == null || y == null || x.length < 5 || x.length != y.length)
        {
            return false;
        }
        // exponential fit requires all positive y values
        boolean allPositive = Arrays.stream(y).allMatch(v -> v > 0);
        if(!allPositive)
        {
            return false;
        }
        try
        {
            ExponentialModel model = new ExponentialModel();
            model.fit(x, y);
            double rSquared = calculateRSquared(model, x, y);
            // also fit a linear model to compare — if linear fits just as well,
            // data is not specifically exponential
            LinearModel linearModel = new LinearModel();
            linearModel.fit(x, y);
            double linearRSquared = calculateRSquared(linearModel, x, y);
            // exponential is the better fit if:
            // 1. R² is above threshold — model explains the data well
            // 2. exponential R² meaningfully beats linear R²
            return rSquared >= 0.85 && rSquared > linearRSquared + 0.05;
        }
        catch(IllegalArgumentException e)
        {
            log.debug("Exponential fit failed: {}", e.getMessage());
            return false;
        }
    }

    // --- private helpers ---

    private void fitAndAdd(
            Map<PositionType, List<MathModel>> models,
            Supplier<AbstractMathModel> factory,
            double[] x, double[] y, double[] z, double[] w)
    {
        AbstractMathModel yModel = factory.get(); yModel.fit(x, y);
        AbstractMathModel zModel = factory.get(); zModel.fit(x, z);
        AbstractMathModel wModel = factory.get(); wModel.fit(x, w);
        models.get(PositionType.SPENDING).add(yModel);
        models.get(PositionType.LEFT_OVER).add(zModel);
        models.get(PositionType.GOALS_MET).add(wModel);
    }

    private void fitAndAddSingle(
            Map<PositionType, List<MathModel>> models,
            PositionType positionType,
            AbstractMathModel model,
            double[] x, double[] y)
    {
        model.fit(x, y);
        models.get(positionType).add(model);
    }

    private double calculateRSquared(
            final MathModel model,
            final double[] x,
            final double[] y)
    {
        double meanY = Arrays.stream(y).average().orElse(0.0);
        double totalSS    = 0.0;
        double residualSS = 0.0;
        for(int i = 0; i < x.length; i++)
        {
            totalSS    += Math.pow(y[i] - meanY, 2);
            residualSS += Math.pow(y[i] - model.evaluate(x[i]), 2);
        }
        return totalSS == 0 ? 0.0 : 1.0 - (residualSS / totalSS);
    }

    private double adjustForOverfitting(double rSquared, int n, int p)
    {
        return 1.0 - ((1.0 - rSquared) * (n - 1)) / (n - p - 1);
    }

    private int getNumberOfParameters(ModelType modelType)
    {
        return switch(modelType)
        {
            case LINEAR, EXPONENTIAL -> 2;
            case QUADRATIC           -> 3;
            case POLYNOMIAL          -> 4;
            default                  -> 0;
        };
    }

    private boolean hasConstantValues(double[] values)
    {
        for(int i = 0; i < values.length - 1; i++)
        {
            if(values[i] != values[i + 1]) return false;
        }
        return true;
    }

    private boolean hasIncreasingOrDecreasing(double[] values)
    {
        for(int i = 0; i < values.length - 1; i++)
        {
            if(Math.abs(values[i]) != Math.abs(values[i + 1])) return true;
        }
        return false;
    }
}
