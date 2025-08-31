package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.domain.math.*;
import com.app.budgetbuddy.exceptions.InvalidCoordinateLengthException;
import com.app.budgetbuddy.exceptions.InvalidMathModelException;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.services.PreCalculationCategoryService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.math3.analysis.UnivariateFunction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class PreCalculationModelService
{
    private final PreCalculationCategoryService preCalculationCategoryService;
    private final Map<String, ModelType> categoryModelTypeMap = new HashMap<>();
    private final Map<WeekNumber, Map<String, BigDecimal>> weeklyCategorySpending = new HashMap<>();
    private final List<CategoryMathModel> categoryMathModels = new ArrayList<>();
    private final List<PreCalculationCategory> preCalculationCategories = new ArrayList<>();

    @Autowired
    public PreCalculationModelService(PreCalculationCategoryService preCalculationCategoryService)
    {
        this.preCalculationCategoryService = preCalculationCategoryService;
    }

    public void savePreCalculationCategories(List<PreCalculationEntry> preCalculationCategories)
    {

    }

    public List<CategoryMathModel> createCategoryMathModelForCategoriesByMonthly(final Map<MonthNumber, List<PreCalculationEntry>> monthlyPrecalculationEntries, final BudgetSchedule budgetSchedule, Long userId)
    {
        return null;
    }

    public List<CategoryCoordinates> convertWeeklyPrecalculationEntriesToCategoryCoordinates(final Map<WeekNumber, List<PreCalculationEntry>> weeklyPrecalculationEntries, final SubBudgetGoals subBudgetGoals)
    {
        if(weeklyPrecalculationEntries.isEmpty())
        {
            return Collections.emptyList();
        }
        List<CategoryCoordinates> categoryCoordinatesList = new ArrayList<>();
        final int numberOfWeeks = weeklyPrecalculationEntries.size();
        BigDecimal weeklySavingGoals = subBudgetGoals.getSavingsTarget().divide(BigDecimal.valueOf(numberOfWeeks)).setScale(2, RoundingMode.HALF_UP);
        for(Map.Entry<WeekNumber, List<PreCalculationEntry>> entry : weeklyPrecalculationEntries.entrySet())
        {
            WeekNumber weekNumber = entry.getKey();
            int weekNumberInt = weekNumber.getWeekNumber();
            List<PreCalculationEntry> preCalculationEntries = entry.getValue();
            for(PreCalculationEntry preCalculationEntry : preCalculationEntries)
            {
                String category = preCalculationEntry.category();
                BigDecimal budgeted = preCalculationEntry.budgeted();
                BigDecimal actual = preCalculationEntry.actual();
                BigDecimal saved = budgeted.subtract(actual);
                double goalSaved = weeklySavingGoals.subtract(saved).doubleValue();
                CategoryCoordinates categoryCoordinates = new CategoryCoordinates(category, weekNumberInt, actual.doubleValue(), saved.doubleValue(), goalSaved);
                categoryCoordinatesList.add(categoryCoordinates);
            }
        }
        return categoryCoordinatesList;
    }

    private BigDecimal getEntryTotal(EntryType entryType, BigDecimal totalSpending, BigDecimal totalBudgeted, BigDecimal totalSaved, BigDecimal totalsGoalsReached)
    {
        switch (entryType) {
            case SAVINGS -> {
                return totalSaved;
            }
            case GOAL_MET -> {
                return totalsGoalsReached;
            }
            case VARIABLE_EXPENSE, FIXED_EXPENSE -> {
                return totalSpending;
            }
            case BUDGETED -> {
                return totalBudgeted;
            }
            default -> {
                throw new IllegalArgumentException("Invalid entry type: " + entryType);
            }
        }
    }

    private double[] convertCoordinatesToDoubles(List<CategoryCoordinates> coordinates, CoordinateType coordinateType)
    {
        if(coordinates.isEmpty())
        {
            return new double[0];
        }
        double[] doubles = new double[coordinates.size()];
        if(coordinateType == CoordinateType.X)
        {
            doubles = coordinates.stream().mapToDouble(CategoryCoordinates::getX).toArray();
        }
        else if(coordinateType == CoordinateType.Y)
        {
            doubles = coordinates.stream().mapToDouble(CategoryCoordinates::getY).toArray();
        }
        else if(coordinateType == CoordinateType.Z)
        {
            doubles = coordinates.stream().mapToDouble(CategoryCoordinates::getZ).toArray();
        }
        else if(coordinateType == CoordinateType.W)
        {
            doubles = coordinates.stream().mapToDouble(CategoryCoordinates::getW).toArray();
        }
        return doubles;
    }

    private Map<String, List<CategoryCoordinates>> groupCategoryCoordinatesByCategory(List<CategoryCoordinates> categoryCoordinatesList)
    {
        return categoryCoordinatesList.stream().collect(Collectors.groupingBy(CategoryCoordinates::getCategory));
    }

    public List<CategoryMathModel> fitCategoryCoordinatesToMathModel(final List<CategoryCoordinates> categoryCoordinatesList)
    {
        if(categoryCoordinatesList.isEmpty())
        {
            return Collections.emptyList();
        }
        List<CategoryMathModel> categoryMathModels = new ArrayList<>();
        long startTime = System.currentTimeMillis();
        log.debug("Start time: {}", startTime);
        Map<String, List<CategoryCoordinates>> coordinatesByCategory = groupCategoryCoordinatesByCategory(categoryCoordinatesList);
        for(Map.Entry<String, List<CategoryCoordinates>> entry : coordinatesByCategory.entrySet())
        {
            String category = entry.getKey();
            List<CategoryCoordinates> categoryCoordinates = entry.getValue();
            double[] x_coordinates = convertCoordinatesToDoubles(categoryCoordinates, CoordinateType.X);
            double[] y_coordinates = convertCoordinatesToDoubles(categoryCoordinates, CoordinateType.Y);
            double[] z_coordinates = convertCoordinatesToDoubles(categoryCoordinates, CoordinateType.Z);
            double[] w_coordinates = convertCoordinatesToDoubles(categoryCoordinates, CoordinateType.W);
            Map<PositionType, List<AbstractMathModel>> models = fitMathModelsByCategoryCoordinates(category, x_coordinates, y_coordinates, z_coordinates, w_coordinates);
            Map<PositionType, AbstractMathModel> bestModels = selectBestModelForPositionType(models);
            // Debug what models were selected
            for (Map.Entry<PositionType, AbstractMathModel> entry1 : bestModels.entrySet()) {
                System.out.println(entry1.getKey() + " selected: " + (entry1.getValue() != null ? entry1.getValue().getClass().getSimpleName() : "null"));
            }
            if(bestModels.isEmpty())
            {
                log.info("No models were found for category: {}", category);
                continue;
            }
            AbstractMathModel spendingModel = bestModels.get(PositionType.SPENDING);
            AbstractMathModel budgetedModel = bestModels.get(PositionType.BUDGETED);
            AbstractMathModel savedModel = bestModels.get(PositionType.LEFT_OVER);
            AbstractMathModel goalsMetModel = bestModels.get(PositionType.GOALS_MET);
            CategoryMathModel categoryMathModel = new CategoryMathModel(spendingModel, savedModel, goalsMetModel, budgetedModel, category);
            categoryMathModels.add(categoryMathModel);
        }
        long endTime = System.currentTimeMillis();
        log.debug("End time: {}", endTime);
        log.debug("Time taken: {} ms", endTime - startTime);
        return categoryMathModels;
    }

    public List<PreCalculationCategory> createPreCalculationCategoriesForCategoriesByWeekly(final Map<WeekNumber, List<PreCalculationEntry>> weeklyPrecalculationEntries, final BudgetSchedule budgetSchedule)
    {
        if(weeklyPrecalculationEntries.isEmpty() || budgetSchedule == null)
        {
            return Collections.emptyList();
        }
        Map<WeekNumber, Map<EntryType, BigDecimal>> weeklyCategorySpending = new HashMap<>();
//        for(Map.Entry<WeekNumber, List<PreCalculationEntry>> entry : weeklyPrecalculationEntries.entrySet())
//        {
//            WeekNumber weekNumber = entry.getKey();
//            List<PreCalculationEntry> preCalculationEntries = entry.getValue();
//            Map<EntryType, BigDecimal> categoryEntryAmountsThisWeek = new HashMap<>();
//            for(PreCalculationEntry preCalculationEntry : preCalculationEntries)
//            {
//                EntryType entryType = preCalculationEntry.entryType();
//                BigDecimal entryAmount = preCalculationEntry.actual();
//                categoryEntryAmountsThisWeek.merge(entryType, entryAmount, BigDecimal::add);
//            }
//            weeklyCategorySpending.put(weekNumber, categoryEntryAmountsThisWeek);
//        }
//        Map<String, List<EntryCoordinates>> categoryCoordinates = convertWeeklyPrecalculationEntriesToCoordinates(weeklyCategorySpending);
//
//        // TODO: Once you have the coordinates for a category, use these coordinates to test against
//        // TODO: Different mathematical models for each different entry type and determine the best model for each entry type
//        List<CategoryMathModel> categoryMathModels = fitCategoryCoordinatesToMathModel(categoryCoordinates);


//        for(Map.Entry<WeekNumber, List<PreCalculationEntry>> entry : weeklyPrecalculationEntries.entrySet())
//        {
//            WeekNumber weekNumber = entry.getKey();
//            List<PreCalculationEntry> preCalculationEntries = entry.getValue();
//            Map<String, BigDecimal> categorySpendingThisWeek = new HashMap<>();
//            for(PreCalculationEntry preCalculationEntry : preCalculationEntries)
//            {
//                String category = preCalculationEntry.category();
//                BigDecimal categorySpending = preCalculationEntry.actual();
//                categorySpendingThisWeek.merge(category, categorySpending, BigDecimal::add);
//            }
//            // TODO: Determine the model type using the pre-calculation entry data
//            weeklyCategorySpending.put(weekNumber, categorySpendingThisWeek);
//        }
//        // Once we obtain the category spending each week by week number
//        // We will need to determine the coordinates for each category
//        Map<String, List<Coordinate>> categoryCoordinates = convertWeeklyPrecalculationEntriesToCoordinates(weeklyCategorySpending);
//        List<CategoryMathModel> categoryMathModels = fitCategoryCoordinatesToMathModel(categoryCoordinates);
//        for(CategoryMathModel categoryMathModel : categoryMathModels)
//        {
//            String category = categoryMathModel.getCategory();
//            AbstractMathModel mathModel = categoryMathModel.getMathModel();
//            PreCalculationEntry preCalculationCategory = new PreCalculationEntry(category, mathModel);
//            preCalculationCategories.add(preCalculationCategory);
//        }
//        return preCalculationCategories;
        return null;
    }

    private int getNumberOfParameters(ModelType modelType)
    {
        return switch (modelType) {
            case LINEAR, EXPONENTIAL -> 2;
            case QUADRATIC -> 3;
            case POLYNOMIAL -> 4;
            default -> 0;
        };
    }

    private double adjustRSquaredForOverfitting(double rSquared, int coordinatesSize, int p)
    {
        return 1.0 - ((1.0 - rSquared) * (coordinatesSize - 1)) / (coordinatesSize - p - 1);
    }

    public Map<PositionType, AbstractMathModel> selectBestModelForPositionType(final Map<PositionType, List<AbstractMathModel>> mathModels)
    {
        if(mathModels.isEmpty())
        {
            return Collections.emptyMap();
        }
        Map<PositionType, AbstractMathModel> bestModels = new HashMap<>();
        long startTime = System.currentTimeMillis();
        log.debug("Start time: {}", startTime);

        for(Map.Entry<PositionType, List<AbstractMathModel>> entry : mathModels.entrySet())
        {
            PositionType positionType = entry.getKey();
            List<AbstractMathModel> models = entry.getValue();
            AbstractMathModel bestModelForPosition = null;
            double bestRSquaredError = 0.0;
            if(models.size() == 1)
            {
                bestModels.put(positionType, models.get(0));
                continue;
            }
            for(int i = 0; i < models.size() - 1; i++)
            {
                AbstractMathModel currentModel = models.get(i);
                if(currentModel == null)
                {
                    throw new InvalidMathModelException("Math Model was found to be null for position type: " + positionType + ", index: " + i + ", models: " + models);
                }
                AbstractMathModel nextModel = models.get(i + 1);
                ModelType currentModelType = currentModel.toModelFunction().getModelType();
                ModelType nextModelType = nextModel.toModelFunction().getModelType();
                int currentNumberOfParameters = getNumberOfParameters(currentModelType);
                int nextModelNumberOfParameters = getNumberOfParameters(nextModelType);
                double[] currentModelParameters = currentModel.getParameters();
                double[] nextModelParameters = nextModel.getParameters();
                double rSquaredError = calculateRSquaredError(currentModel, currentModelParameters, nextModelParameters);
                double rSquaredOverfittingError = adjustRSquaredForOverfitting(rSquaredError, currentNumberOfParameters, nextModelNumberOfParameters);
                if(rSquaredOverfittingError > bestRSquaredError)
                {
                    bestRSquaredError = rSquaredOverfittingError;
                    bestModelForPosition = currentModel;
                }
                if(rSquaredOverfittingError > 0.9)
                {
                    log.debug("Overfitting detected for model: {}, rSquaredError: {}", currentModel, rSquaredError);
                    continue;
                }
                if(rSquaredOverfittingError > 0.8)
                {
                    log.debug("Very Overfitting detected for model: {}, rSquaredError: {}", currentModel, rSquaredError);
                }
            }
            bestModels.put(positionType, bestModelForPosition);
        }
        long endTime = System.currentTimeMillis();
        log.debug("End time: {}", endTime);
        log.debug("Time taken: {} ms", endTime - startTime);
        return bestModels;
    }

    private double calculateRSquaredError(AbstractMathModel model, double[] x, double[] y)
    {
        UnivariateFunction function = model.getFunction();
        double meanY = Arrays.stream(y).average().orElse(0.0);
        double totalSummedSquares = 0.0;
        double residualSummedSquares = 0.0;
        for (int i = 0; i < x.length; i++)
        {
            double actual = y[i];
            double predicted = function.value(x[i]);
            totalSummedSquares += Math.pow(actual - meanY, 2);
            residualSummedSquares += Math.pow(actual - predicted, 2);
        }
        if (totalSummedSquares == 0)
        {
            return 0.0;
        }
        return 1.0 - (residualSummedSquares / totalSummedSquares);
    }

    public boolean looksExponential(double[] x_coordinates, double[] y_coordinates)
    {
        if(x_coordinates.length == 0 || y_coordinates.length == 0)
        {
            return false;
        }
        int n = y_coordinates.length;
        if (n < 5) return false;

        // Require mostly positive values
        long positiveCount = Arrays.stream(y_coordinates).filter(val -> val > 0).count();
        if (positiveCount < n * 0.8) return false;

        // Compute log differences (should be roughly constant for exponential data)
        List<Double> logDiffs = new ArrayList<>();
        for (int i = 0; i < n - 1; i++) {
            if (y_coordinates[i] > 0 && y_coordinates[i+1] > 0) {
                double diff = Math.log(y_coordinates[i+1]) - Math.log(y_coordinates[i]);
                logDiffs.add(diff);
            }
        }

        if (logDiffs.size() < 2) return false;

        // Check variation in log differences
        double mean = logDiffs.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        double variance = logDiffs.stream()
                .mapToDouble(d -> Math.pow(d - mean, 2))
                .average().orElse(0);
        double stdDev = Math.sqrt(variance);

        double coefficientOfVariation = Math.abs(mean) < 1e-10 ? Double.MAX_VALUE : stdDev / Math.abs(mean);

        return coefficientOfVariation <= 0.6;  // threshold for "exponential-like"
    }


    private boolean hasIncreasingValuesOrDecreasing(double[] coordinates)
    {
        for(int i = 0; i < coordinates.length; i++)
        {
            log.debug("Comparing coordinates[{}]={} with coordinates[{}]={}",
                    i, coordinates[i], i+1, coordinates[i + 1]);

            double absPosI = Math.abs(coordinates[i]);
            double absPosI1 = Math.abs(coordinates[i + 1]);
            boolean isLess = absPosI < absPosI1;
            boolean isGreater = absPosI > absPosI1;
            log.debug("isLess: {}, isGreater: {}", isLess, isGreater);
            if(isLess || isGreater)
            {
                log.debug("Found change, returning true");
                return true;
            }
        }
        log.debug("Is Increasing");
        return false;
    }

    private boolean hasConstantValues(double[] coordinates)
    {
        for(int i = 0; i < coordinates.length - 1; i++)
        {
            if(coordinates[i] != coordinates[i + 1])
            {
                return false;
            }
        }
        return true;
    }

    public void initializeModelsByEntryTypeMap(Map<PositionType, List<AbstractMathModel>> modelsByEntryType)
    {
        modelsByEntryType.put(PositionType.SPENDING, new ArrayList<>());
        modelsByEntryType.put(PositionType.LEFT_OVER, new ArrayList<>());
        modelsByEntryType.put(PositionType.GOALS_MET, new ArrayList<>());
    }

    public Map<PositionType, List<AbstractMathModel>> fitMathModelsByCategoryCoordinates(String category, double[] x_coordinates, double[] y_coordinates, double[] z_coordinates, double[] w_coordinates)
    {
        Map<PositionType, List<AbstractMathModel>> modelsByEntryType = new HashMap<>();
        initializeModelsByEntryTypeMap(modelsByEntryType);
        if(x_coordinates.length == 0 || y_coordinates.length == 0 || z_coordinates.length == 0 || w_coordinates.length == 0)
        {
            return Collections.emptyMap();
        }
        int xLength = x_coordinates.length;
        int yLength = y_coordinates.length;
        int zLength = z_coordinates.length;
        int wLength = w_coordinates.length;
        if(xLength != yLength || xLength != zLength || xLength != wLength)
        {
            throw new InvalidCoordinateLengthException("x coordinate length doesn't match y coordinate length. x length: " + x_coordinates.length + ", y length: " + y_coordinates.length);
        }
        if(hasConstantValues(y_coordinates) || hasConstantValues(z_coordinates) || hasConstantValues(w_coordinates))
        {
            ConstantModel yConstantModel = new ConstantModel();
            yConstantModel.fit(x_coordinates, y_coordinates);
            modelsByEntryType.get(PositionType.SPENDING).add(yConstantModel);

            ConstantModel zConstantModel = new ConstantModel();
            zConstantModel.fit(x_coordinates, z_coordinates);
            modelsByEntryType.get(PositionType.LEFT_OVER).add(zConstantModel);

            ConstantModel wConstantModel = new ConstantModel();
            wConstantModel.fit(x_coordinates, w_coordinates);
            modelsByEntryType.get(PositionType.GOALS_MET).add(wConstantModel);
        }
        if(xLength >= 2)
        {
            if(hasIncreasingValuesOrDecreasing(y_coordinates) || hasIncreasingValuesOrDecreasing(z_coordinates) || hasIncreasingValuesOrDecreasing(w_coordinates))
            {
                LinearModel xyLinearModel = new LinearModel();
                xyLinearModel.fit(x_coordinates, y_coordinates);
                modelsByEntryType.get(PositionType.SPENDING).add(xyLinearModel);

                LinearModel xzLinearModel = new LinearModel();
                xzLinearModel.fit(x_coordinates, z_coordinates);
                modelsByEntryType.get(PositionType.LEFT_OVER).add(xzLinearModel);

                LinearModel xwLinearModel = new LinearModel();
                xwLinearModel.fit(x_coordinates, w_coordinates);
                modelsByEntryType.get(PositionType.GOALS_MET).add(xwLinearModel);
            }
        }
        if(xLength >= 3)
        {
            QuadraticModel xyQuadraticModel = new QuadraticModel();
            xyQuadraticModel.fit(x_coordinates, y_coordinates);
            modelsByEntryType.get(PositionType.SPENDING).add(xyQuadraticModel);

            QuadraticModel xzQuadraticModel = new QuadraticModel();
            xzQuadraticModel.fit(x_coordinates, z_coordinates);
            modelsByEntryType.get(PositionType.LEFT_OVER).add(xzQuadraticModel);

            QuadraticModel xwQuadraticModel = new QuadraticModel();
            xwQuadraticModel.fit(x_coordinates, w_coordinates);
            modelsByEntryType.get(PositionType.GOALS_MET).add(xwQuadraticModel);
        }
        if(xLength >= 4)
        {
            PolynomialModel xyPolynomialModel = new PolynomialModel();
            xyPolynomialModel.fit(x_coordinates, y_coordinates);
            modelsByEntryType.get(PositionType.SPENDING).add(xyPolynomialModel);

            PolynomialModel xzPolynomialModel = new PolynomialModel();
            xzPolynomialModel.fit(x_coordinates, z_coordinates);
            modelsByEntryType.get(PositionType.LEFT_OVER).add(xzPolynomialModel);

            PolynomialModel xwPolynomialModel = new PolynomialModel();
            xwPolynomialModel.fit(x_coordinates, w_coordinates);
            modelsByEntryType.get(PositionType.GOALS_MET).add(xwPolynomialModel);
        }
        if(xLength >= 5)
        {
            if(looksExponential(x_coordinates, y_coordinates))
            {
                ExponentialModel xyExponentialModel = new ExponentialModel();
                xyExponentialModel.fit(x_coordinates, y_coordinates);
                modelsByEntryType.get(PositionType.SPENDING).add(xyExponentialModel);
            }
            else if(looksExponential(x_coordinates, z_coordinates))
            {
                ExponentialModel xzExponentialModel = new ExponentialModel();
                xzExponentialModel.fit(x_coordinates, z_coordinates);
                modelsByEntryType.get(PositionType.LEFT_OVER).add(xzExponentialModel);
            }
            else if(looksExponential(x_coordinates, w_coordinates))
            {
                ExponentialModel xwExponentialModel = new ExponentialModel();
                xwExponentialModel.fit(x_coordinates, w_coordinates);
                modelsByEntryType.get(PositionType.GOALS_MET).add(xwExponentialModel);
            }
        }
        return modelsByEntryType;
    }

    public List<PreCalculationEntry> fitPreCalculationCategoriesWithGoalEntries(Map<WeekNumber, List<PreCalculationGoalEntry>> weeklyPrecalculationGoals, final BudgetSchedule budgetSchedule, final Long userId)
    {
        return null;
    }

}
