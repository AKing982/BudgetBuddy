package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.domain.math.*;
import com.app.budgetbuddy.exceptions.InvalidCoordinateLengthException;
import com.app.budgetbuddy.exceptions.InvalidMathModelException;
import com.app.budgetbuddy.services.PreCalculationCategoryService;
import com.app.budgetbuddy.services.PreCalculationCategoryServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class PreCalculationModelServiceTest
{

    @MockBean
    private PreCalculationCategoryService preCalculationCategoryService;

    @Autowired
    private PreCalculationModelService preCalculationModelService;

    private BudgetSchedule budgetSchedule;

    private SubBudget subBudget;
    private Budget budget;
    private SubBudgetGoals subBudgetGoals;

    @BeforeEach
    void setUp() {

        budget = Budget.builder()
                .budgetPeriod(Period.MONTHLY)
                .startDate(LocalDate.of(2025, 1, 1))
                .endDate(LocalDate.of(2025, 12, 31))
                .income(BigDecimal.valueOf(39000))
                .savingsProgress(BigDecimal.valueOf(0))
                .totalMonthsToSave(12)
                .budgetAmount(BigDecimal.valueOf(39000))
                .budgetMode(BudgetMode.SAVINGS_PLAN)
                .budgetName("2025 Savings Budget Plan")
                .userId(1L)
                .build();

        subBudgetGoals = new SubBudgetGoals();
        subBudgetGoals.setContributedAmount(new BigDecimal("150"));
        subBudgetGoals.setSubBudgetId(3L);
        subBudgetGoals.setSavingsTarget(new BigDecimal("250.00"));
        subBudgetGoals.setStatus(GoalStatus.IN_PROGRESS);
        subBudgetGoals.setId(3L);
        subBudgetGoals.setGoalScore(new BigDecimal("0.60"));

        budgetSchedule = new BudgetSchedule();
        budgetSchedule.setStartDate(LocalDate.of(2025, 3, 1));
        budgetSchedule.setEndDate(LocalDate.of(2025, 3, 31));
        budgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)));

        subBudget = new SubBudget();
        subBudget.setId(3L);
        subBudget.setSubBudgetName("March 2025");
        subBudget.setBudget(budget);
        subBudget.setBudgetSchedule(List.of(budgetSchedule));
        subBudget.setStartDate(LocalDate.of(2025, 3, 1));
        subBudget.setEndDate(LocalDate.of(2025, 3, 31));
        subBudget.setAllocatedAmount(new BigDecimal(3250));
        subBudget.setSubSavingsTarget(new BigDecimal("200.00"));
    }

//    @Test
//    void testCreateCategoryMathModelForCategoriesByWeekly_whenWeeklyPreCalculationsIsEmpty_thenReturnEmptyList(){
//        Map<WeekNumber, List<PreCalculationEntry>> weeklyPreCalculations = Map.of();
//        List<CategoryMathModel> categoryMathModels = preCalculationModelService.createCategoryMathModelForCategoriesByWeekly(weeklyPreCalculations, budgetSchedule, 1L);
//        assertTrue(categoryMathModels.isEmpty());
//    }
//
//    @Test
//    void testCreateCategoryMathModelForCategoriesByWeekly_whenBudgetScheduleIsNull_thenReturnEmptyList(){
//        Map<WeekNumber, List<PreCalculationEntry>> weeklyPreCalculations = new HashMap<>();
//        DateRange dateRange = new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31));
//        weeklyPreCalculations.put(new WeekNumber(), List.of(new PreCalculationEntry("Gas",dateRange, new BigDecimal("40.23"), new BigDecimal("23.45"), EntryType.VARIABLE_EXPENSE )));
//        List<CategoryMathModel> categoryMathModels = preCalculationModelService.createCategoryMathModelForCategoriesByWeekly(weeklyPreCalculations, null, 1L);
//        assertTrue(categoryMathModels.isEmpty());
//    }

//    @Test
//    void testCreateCategoryMathModelForCategoriesByWeekly_valid()
//    {
//        Map<WeekNumber, List<PreCalculationEntry>> weeklyPreCalculations = new HashMap<>();
//        DateRange week1DateRange = new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 2));
//        WeekNumber weekNumber1 = new WeekNumber(9, 2025, week1DateRange);
//        PreCalculationEntry week1GasEntry = new PreCalculationEntry("Gas", week1DateRange, new BigDecimal("40.23"), new BigDecimal("23.45"), EntryType.VARIABLE_EXPENSE);
//        PreCalculationEntry week1RentEntry = new PreCalculationEntry("Rent", week1DateRange, new BigDecimal("1200.0"), new BigDecimal("1200.0"), EntryType.FIXED_EXPENSE);
//        PreCalculationEntry week1FoodEntry = new PreCalculationEntry("Groceries", week1DateRange, new BigDecimal("160"), new BigDecimal("145"), EntryType.FIXED_EXPENSE);
//        List<PreCalculationEntry> week1PreCalculations = new ArrayList<>();
//        week1PreCalculations.add(week1GasEntry);
//        week1PreCalculations.add(week1RentEntry);
//        week1PreCalculations.add(week1FoodEntry);
//
//        DateRange week2DateRange = new DateRange(LocalDate.of(2025, 3, 3), LocalDate.of(2025, 3, 9));
//        WeekNumber weekNumber2 = new WeekNumber(10, 2025, week2DateRange);
//        PreCalculationEntry week2GroceriesEntry = new PreCalculationEntry("Groceries", week2DateRange, new BigDecimal("160"), new BigDecimal("125.35"), EntryType.VARIABLE_EXPENSE);
//        PreCalculationEntry week2PaymentsEntry = new PreCalculationEntry("Payments", week2DateRange, new BigDecimal("150.32"), new BigDecimal("90.60"), EntryType.FIXED_EXPENSE);
//        PreCalculationEntry week2Subscriptions = new PreCalculationEntry("Subscriptions", week2DateRange, new BigDecimal("250"), new BigDecimal("50.02"), EntryType.FIXED_EXPENSE);
//        PreCalculationEntry week2GasEntry = new PreCalculationEntry("Gas", week2DateRange, new BigDecimal("40.23"), new BigDecimal("35.02"), EntryType.VARIABLE_EXPENSE);
//        List<PreCalculationEntry> week2PreCalculations = new ArrayList<>();
//        week2PreCalculations.add(week2GroceriesEntry);
//        week2PreCalculations.add(week2PaymentsEntry);
//        week2PreCalculations.add(week2Subscriptions);
//        week2PreCalculations.add(week2GasEntry);
//
//        DateRange week3DateRange = new DateRange(LocalDate.of(2025, 3, 10), LocalDate.of(2025, 3, 16));
//        WeekNumber weekNumber3 = new WeekNumber(11, 2025, week3DateRange);
//        PreCalculationEntry week3GroceriesEntry = new PreCalculationEntry("Groceries", week3DateRange, new BigDecimal("160"), new BigDecimal("115.23"), EntryType.VARIABLE_EXPENSE);
//        PreCalculationEntry week3RentEntry = new PreCalculationEntry("Rent", week3DateRange, new BigDecimal("707.0"), new BigDecimal("707.0"), EntryType.FIXED_EXPENSE);
//        PreCalculationEntry insuranceEntry = new PreCalculationEntry("Insurance", week3DateRange, new BigDecimal("95.23"), new BigDecimal("80.25"), EntryType.FIXED_EXPENSE);
//        PreCalculationEntry week3GasEntry = new PreCalculationEntry("Gas", week3DateRange, new BigDecimal("40.23"), new BigDecimal("18.35"), EntryType.VARIABLE_EXPENSE);
//        List<PreCalculationEntry> week3PreCalculations = new ArrayList<>();
//        week3PreCalculations.add(week3GroceriesEntry);
//        week3PreCalculations.add(week3RentEntry);
//        week3PreCalculations.add(insuranceEntry);
//        week3PreCalculations.add(week3GasEntry);
//
//        DateRange week4DateRange = new DateRange(LocalDate.of(2025, 3, 17), LocalDate.of(2025, 3, 23));
//        WeekNumber weekNumber4 = new WeekNumber(12, 2025, week4DateRange);
//        PreCalculationEntry week4GroceriesEntry = new PreCalculationEntry("Groceries", week4DateRange, new BigDecimal("160"), new BigDecimal("105.23"), EntryType.VARIABLE_EXPENSE);
//        PreCalculationEntry week4GasEntry = new PreCalculationEntry("Gas", week4DateRange, new BigDecimal("40.23"), new BigDecimal("23.45"), EntryType.VARIABLE_EXPENSE);
//        PreCalculationEntry paymentsEntry = new PreCalculationEntry("Payments", week4DateRange, new BigDecimal("150.32"), new BigDecimal("35.23"), EntryType.FIXED_EXPENSE);
//        PreCalculationEntry subscriptionsEntry = new PreCalculationEntry("Subscriptions", week4DateRange, new BigDecimal("250"), new BigDecimal("65.23"), EntryType.FIXED_EXPENSE);
//        List<PreCalculationEntry> week4PreCalculations = new ArrayList<>();
//        week4PreCalculations.add(week4GroceriesEntry);
//        week4PreCalculations.add(week4GasEntry);
//        week4PreCalculations.add(paymentsEntry);
//        week4PreCalculations.add(subscriptionsEntry);
//
//        weeklyPreCalculations.put(weekNumber1, week1PreCalculations);
//        weeklyPreCalculations.put(weekNumber2, week2PreCalculations);
//        weeklyPreCalculations.put(weekNumber3, week3PreCalculations);
//        weeklyPreCalculations.put(weekNumber4, week4PreCalculations);
//
//        List<CategoryMathModel> actual = preCalculationModelService.createCategoryMathModelForCategoriesByMonthly(weeklyPreCalculations, budgetSchedule, 1L);
//        assertNotNull(actual);
//
//        // Verify we have the expected categories
//        Set<String> expectedCategories = Set.of("Groceries", "Payments", "Subscriptions", "Rent", "Gas");
//        Set<String> actualCategories = actual.stream()
//                .map(CategoryMathModel::getCategory)
//                .collect(Collectors.toSet());
//
//        assertTrue(actualCategories.containsAll(expectedCategories), "All expected categories should be present");
//
//        // Verify each category has a valid math model with non-null equation string
//        for (CategoryMathModel categoryMathModel : actual) {
//            assertNotNull(categoryMathModel.getMathModel(), "Math model should not be null");
//            assertNotNull("Equation string should not be null", categoryMathModel.getMathModel().getEquationString());
//            assertNotNull("Category should not be null", categoryMathModel.getCategory());
//        }
//    }

    @Test
    void testDetermineBestMathModelByCategoryCoordinates_whenXCoordinatesArrayEmpty_thenReturnEmptyMap(){
        double[] x_coordinates = new double[]{};
        double[] y_coordinates = new double[]{78, 152, 105, 97};
        double[] z_coordinates = new double[]{0, 10, 5, 15};
        double[] w_coordinates = new double[]{0, 0, 2, 3};
        Map<PositionType, List<AbstractMathModel>> actual = preCalculationModelService.fitMathModelsByCategoryCoordinates("Gas", x_coordinates, y_coordinates, z_coordinates, w_coordinates);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testDetermineBestMathModelByCategoryCoordinates_whenYCoordinatesArrayEmpty_thenReturnEmptyMap(){
        double[] x_coordinates = new double[]{78, 152, 105, 97};
        double[] y_coordinates = new double[]{};
        double[] z_coordinates = new double[]{0, 10, 5, 15};
        double[] w_coordinates = new double[]{0, 0, 2, 3};
        Map<PositionType, List<AbstractMathModel>> actual = preCalculationModelService.fitMathModelsByCategoryCoordinates("Gas", x_coordinates, y_coordinates, z_coordinates, w_coordinates);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testFitMathModelsByCategoryCoordinates_whenZCoordinatesArrayEmpty_thenReturnEmptyMap(){
        double[] x_coordinates = new double[]{78, 152, 105, 97};
        double[] y_coordinates = new double[]{78, 152, 105, 97};
        double[] z_coordinates = new double[]{};
        double[] w_coordinates = new double[]{0, 0, 2, 3};
        Map<PositionType, List<AbstractMathModel>> actual = preCalculationModelService.fitMathModelsByCategoryCoordinates("Gas", x_coordinates, y_coordinates, z_coordinates, w_coordinates);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testFitMathModelsByCategoryCoordinates_whenXCoordinatesDoesntEqualYLength_thenThrowException(){
        double[] x_coordinates = new double[]{78, 152, 105, 97};
        double[] y_coordinates = new double[]{78, 152, 105};
        double[] z_coordinates = new double[]{0, 10, 5, 15};
        double[] w_coordinates = new double[]{0, 0, 2, 3};
        assertThrows(InvalidCoordinateLengthException.class, () -> {
            preCalculationModelService.fitMathModelsByCategoryCoordinates("Gas", x_coordinates, y_coordinates, z_coordinates, w_coordinates);
        });
    }

    @Test
    void testFitMathModelsByCategoryCoordinates_whenXCoordinatesDoesntEqualZLength_thenThrowException(){
        double[] x_coordinates = new double[]{78, 152, 105, 97};
        double[] y_coordinates = new double[]{78, 152, 105, 97};
        double[] z_coordinates = new double[]{0, 10, 5};
        double[] w_coordinates = new double[]{0, 0, 2, 3};
        assertThrows(InvalidCoordinateLengthException.class, () -> {
            preCalculationModelService.fitMathModelsByCategoryCoordinates("Gas", x_coordinates, y_coordinates, z_coordinates, w_coordinates);
        });
    }

    @Test
    void testFitMathModelsByCategoryCoordinates_whenXCoordinatesDoesntEqualWLength_thenThrowException(){
        double[] x_coordinates = new double[]{78, 152, 105, 97};
        double[] y_coordinates = new double[]{78, 152, 105, 97};
        double[] z_coordinates = new double[]{0, 10, 5, 15};
        double[] w_coordinates = new double[]{0, 0, 2};
        assertThrows(InvalidCoordinateLengthException.class, () -> {
            preCalculationModelService.fitMathModelsByCategoryCoordinates("Gas", x_coordinates, y_coordinates, z_coordinates, w_coordinates);
        });
    }

    @Test
    void testDetermineBestMathModelsByCategoryCoordinates_whenCoordinatesSizeIsTwo_thenReturnLinearModel()
    {
        double[] x_coordinates = new double[]{10, 11};
        double[] y_coordinates = new double[]{78, 152};
        double[] z_coordinates = new double[]{5, 10};
        double[] w_coordinates = new double[]{-12, -5};

        Map<PositionType, List<AbstractMathModel>> expected = new HashMap<>();

        List<AbstractMathModel> xyModels = new ArrayList<>();
        LinearModel spendingModel = new LinearModel();
        spendingModel.fit(x_coordinates, y_coordinates);
        xyModels.add(spendingModel);

        List<AbstractMathModel> zModels = new ArrayList<>();
        LinearModel leftOverModel = new LinearModel();
        leftOverModel.fit(x_coordinates, z_coordinates);
        zModels.add(leftOverModel);

        List<AbstractMathModel> wModels = new ArrayList<>();
        LinearModel goalsMetModel = new LinearModel();
        goalsMetModel.fit(x_coordinates, w_coordinates);
        wModels.add(goalsMetModel);

        expected.put(PositionType.SPENDING, xyModels);
        expected.put(PositionType.LEFT_OVER, zModels);
        expected.put(PositionType.GOALS_MET, wModels);

        Map<PositionType, List<AbstractMathModel>> actual = preCalculationModelService.fitMathModelsByCategoryCoordinates("Insurance", x_coordinates, y_coordinates, z_coordinates, w_coordinates);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());

        // Verify each model type and its equation
        for (PositionType positionType : expected.keySet()) {
            assertTrue(actual.containsKey(positionType),
                    "Actual result should contain " + positionType);

            AbstractMathModel expectedModel = expected.get(positionType).get(0);
            AbstractMathModel actualModel = actual.get(positionType).get(0);

            // Verify model type
            assertEquals(expectedModel.getClass(), actualModel.getClass(),
                    "Model type mismatch for " + positionType);

            // Verify equation strings match
            assertEquals(expectedModel.getEquationString(), actualModel.getEquationString(),
                    "Equation mismatch for " + positionType);
        }
    }

    @Test
    void testDetermineBestMathModelsByCategoryCoordinates_whenCoordinatesSizeIsThree_thenReturnQuadraticModelAndOtherModels()
    {
        double[] x_coordinates = new double[]{10, 11, 12};
        double[] y_coordinates = new double[]{105, 152, 226};
        double[] z_coordinates = new double[]{45, -2, -60};
        double[] w_coordinates = new double[]{-15, -2, -60};

        Map<PositionType, List<AbstractMathModel>> expected = new HashMap<>();

        List<AbstractMathModel> xyModels = new ArrayList<>();
        QuadraticModel quadraticModel = new QuadraticModel();
        quadraticModel.fit(x_coordinates, y_coordinates);
        LinearModel xyLinearModel = new LinearModel();
        xyLinearModel.fit(x_coordinates, y_coordinates);
        xyModels.add(xyLinearModel);
        xyModels.add(quadraticModel);

        expected.put(PositionType.SPENDING, xyModels);

        List<AbstractMathModel> zModels = new ArrayList<>();
        QuadraticModel zQuadraticModel = new QuadraticModel();
        zQuadraticModel.fit(x_coordinates, z_coordinates);
        LinearModel zLinearModel = new LinearModel();
        zLinearModel.fit(x_coordinates, z_coordinates);
        zModels.add(zLinearModel);
        zModels.add(zQuadraticModel);

        expected.put(PositionType.LEFT_OVER, zModels);

        List<AbstractMathModel> wModels = new ArrayList<>();
        QuadraticModel wModel = new QuadraticModel();
        wModel.fit(x_coordinates, w_coordinates);
        LinearModel wLinearModel = new LinearModel();
        wLinearModel.fit(x_coordinates, w_coordinates);
        wModels.add(wLinearModel);
        wModels.add(wModel);
        expected.put(PositionType.GOALS_MET, wModels);

        Map<PositionType, List<AbstractMathModel>> actual = preCalculationModelService.fitMathModelsByCategoryCoordinates("Groceries", x_coordinates, y_coordinates, z_coordinates, w_coordinates);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());

        // Fix: Can't sort Maps directly - iterate through expected keys instead
        for (PositionType positionType : expected.keySet()) {
            assertTrue(actual.containsKey(positionType),
                    "Actual result should contain " + positionType);

            AbstractMathModel expectedModel = expected.get(positionType).get(0);
            AbstractMathModel actualModel = actual.get(positionType).get(0);

            // Verify model type
            assertEquals(expectedModel.getClass(), actualModel.getClass(),
                    "Model type mismatch for " + positionType);

            // Verify equation strings match
            assertEquals(expectedModel.getEquationString(), actualModel.getEquationString(),
                    "Equation mismatch for " + positionType);
        }
    }

    @Test
    void testDetermineBestMathModelsByCategoryCoordinates_whenCoordinatesSizeIsFour_thenReturnPolynomialModel()
    {
        double[] x_coordinates = new double[]{10, 11, 12, 13};
        double[] y_coordinates = new double[]{78, 152, 226, 300};
        double[] z_coordinates = new double[]{45, -2, -60, -100};
        double[] w_coordinates = new double[]{-15, -2, -60, -100};

        Map<PositionType, List<AbstractMathModel>> expected = new HashMap<>();

        List<AbstractMathModel> xyModels = new ArrayList<>();
        PolynomialModel polynomialModel = new PolynomialModel(3);
        polynomialModel.fit(x_coordinates, y_coordinates);
        LinearModel xyLinearModel = new LinearModel();
        xyLinearModel.fit(x_coordinates, y_coordinates);
        xyModels.add(xyLinearModel);
        xyModels.add(polynomialModel);

        expected.put(PositionType.SPENDING, xyModels);

        List<AbstractMathModel> zModels = new ArrayList<>();
        PolynomialModel zPolynomialModel = new PolynomialModel(3);
        zPolynomialModel.fit(x_coordinates, z_coordinates);
        LinearModel zLinearModel = new LinearModel();
        zLinearModel.fit(x_coordinates, z_coordinates);
        zModels.add(zLinearModel);
        zModels.add(zPolynomialModel);
        expected.put(PositionType.LEFT_OVER, zModels);

        List<AbstractMathModel> wModels = new ArrayList<>();
        PolynomialModel wPolynomialModel = new PolynomialModel(3);
        wPolynomialModel.fit(x_coordinates, w_coordinates);
        LinearModel wLinearModel = new LinearModel();
        wLinearModel.fit(x_coordinates, w_coordinates);
        wModels.add(wLinearModel);
        wModels.add(wPolynomialModel);
        expected.put(PositionType.GOALS_MET, wModels);

        Map<PositionType, List<AbstractMathModel>> actual = preCalculationModelService.fitMathModelsByCategoryCoordinates("Gas", x_coordinates, y_coordinates, z_coordinates, w_coordinates);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        // Fix: Can't sort Maps directly - iterate through expected keys instead
        for (PositionType positionType : expected.keySet()) {
            assertTrue(actual.containsKey(positionType),
                    "Actual result should contain " + positionType);

            AbstractMathModel expectedModel = expected.get(positionType).get(0);
            AbstractMathModel actualModel = actual.get(positionType).get(0);

            // Verify model type
            assertEquals(expectedModel.getClass(), actualModel.getClass(),
                    "Model type mismatch for " + positionType);

            // Verify equation strings match
            assertEquals(expectedModel.getEquationString(), actualModel.getEquationString(),
                    "Equation mismatch for " + positionType);
        }
    }

    @Test
    void testDetermineBestMathModelsByCategoryCoordinates_whenYCoordinatesHaveSharpIncrease_thenReturnExponentialModel()
    {
        double[] x_coordinates = new double[]{10, 11, 12, 13, 14, 15};
        double[] y_coordinates = new double[]{50.0, 98.0, 195.0, 390.0, 780.0, 1560.0};
        double[] z_coordinates = new double[]{25.0, 50.0, 100.0, 200.0, 400.0, 800.0};
        double[] w_coordinates = new double[]{10.0, 22.0, 48.0, 106.0, 233.0, 512.0};

        Map<PositionType, List<AbstractMathModel>> expected = new HashMap<>();

        List<AbstractMathModel> xyModels = new ArrayList<>();
        ExponentialModel exponentialModel = new ExponentialModel();
        LinearModel xyLinearModel = new LinearModel();
        xyLinearModel.fit(x_coordinates, y_coordinates);
        exponentialModel.fit(x_coordinates, y_coordinates);
        xyModels.add(xyLinearModel);
        xyModels.add(exponentialModel);
        expected.put(PositionType.SPENDING, xyModels);

        List<AbstractMathModel> zModels = new ArrayList<>();
        ExponentialModel leftOverModel = new ExponentialModel();
        leftOverModel.fit(x_coordinates, z_coordinates);
        LinearModel zLinearModel = new LinearModel();
        zLinearModel.fit(x_coordinates, z_coordinates);
        zModels.add(zLinearModel);
        zModels.add(leftOverModel);
        expected.put(PositionType.LEFT_OVER, zModels);

        List<AbstractMathModel> wModels = new ArrayList<>();
        ExponentialModel goalsMetModel = new ExponentialModel();
        goalsMetModel.fit(x_coordinates, w_coordinates);
        LinearModel wLinearModel = new LinearModel();
        wLinearModel.fit(x_coordinates, w_coordinates);
        wModels.add(wLinearModel);
        wModels.add(goalsMetModel);

        expected.put(PositionType.GOALS_MET, wModels);

        Map<PositionType, List<AbstractMathModel>> actual = preCalculationModelService.fitMathModelsByCategoryCoordinates("Groceries", x_coordinates, y_coordinates, z_coordinates, w_coordinates);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());

        // Verify each position returns ExponentialModel
        for (PositionType positionType : expected.keySet()) {
            assertTrue(actual.containsKey(positionType),
                    "Actual result should contain " + positionType);

            AbstractMathModel expectedModel = expected.get(positionType).get(0);
            AbstractMathModel actualModel = actual.get(positionType).get(0);

            // Verify model type is ExponentialModel
            assertEquals(expectedModel.getEquationString(), actualModel.getEquationString(),
                    "Expected model doesn't match for " + positionType);

        }
    }

    @Test
    void testFitMathModelsByCategoryCoordinates_whenCoordinatesSizeIsFive_thenReturnModels()
    {
        double[] x_coordinates = new double[]{10, 11, 12, 13, 14, 15};
        double[] y_coordinates = new double[]{70.0, 75.0, 80.0, 85.0, 90.0, 95.0};
        double[] z_coordinates = new double[]{80.0, 75.0, 70.0, 65.0, 60.0, 55.0};
        double[] w_coordinates = new double[]{60.0, 55.0, 60.0, 65.0, 70.0, 75.0};
        Map<PositionType, List<AbstractMathModel>> expected = new HashMap<>();

        List<AbstractMathModel> xyModels = new ArrayList<>();
        LinearModel linearModel = new LinearModel();
        linearModel.fit(x_coordinates, y_coordinates);
        ExponentialModel exponentialModel = new ExponentialModel();
        exponentialModel.fit(x_coordinates, y_coordinates);
        QuadraticModel quadraticModel = new QuadraticModel();
        quadraticModel.fit(x_coordinates, y_coordinates);

        xyModels.add(quadraticModel);
        xyModels.add(linearModel);
        xyModels.add(exponentialModel);
        expected.put(PositionType.SPENDING, xyModels);

        List<AbstractMathModel> zModels = new ArrayList<>();
        LinearModel leftOverModel = new LinearModel();
        leftOverModel.fit(x_coordinates, z_coordinates);
        PolynomialModel zPolynomialModel = new PolynomialModel(3);
        zPolynomialModel.fit(x_coordinates, z_coordinates);
        zModels.add(zPolynomialModel);
        zModels.add(leftOverModel);
        expected.put(PositionType.LEFT_OVER, zModels);

        List<AbstractMathModel> wModels = new ArrayList<>();
        PolynomialModel polynomialModel = new PolynomialModel(3);
        LinearModel wLinearModel = new LinearModel();
        wLinearModel.fit(x_coordinates, w_coordinates);
        polynomialModel.fit(x_coordinates, w_coordinates);
        wModels.add(polynomialModel);
        wModels.add(wLinearModel);
        expected.put(PositionType.GOALS_MET, wModels);

        Map<PositionType, List<AbstractMathModel>> actual = preCalculationModelService.fitMathModelsByCategoryCoordinates("Groceries", x_coordinates, y_coordinates, z_coordinates, w_coordinates);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for (PositionType positionType : expected.keySet()) {
            assertTrue(actual.containsKey(positionType),
                    "Actual result should contain " + positionType);

            AbstractMathModel expectedSpendingModel = expected.get(positionType).get(1);
            AbstractMathModel actualSpendingModel = actual.get(positionType).get(0);

            // Verify equation strings match
            assertEquals(expectedSpendingModel.getEquationString(), actualSpendingModel.getEquationString(),
                    "Equation mismatch for " + positionType);
        }
    }

    @Test
    void testLooksExponential_whenXCoordinatesHaveNoData_thenReturnFalse(){
        double[] x_coordinates = new double[]{};
        double[] y_coordinates = new double[]{78, 152, 250, 350};
        boolean actual = preCalculationModelService.looksExponential(x_coordinates, y_coordinates);
        assertFalse(actual);
    }

    @Test
    void testLooksExponential_whenYCoordinatesHaveNoData_thenReturnFalse(){
        double[] x_coordinates = new double[]{10, 11, 12, 13};
        double[] y_coordinates = new double[]{};
        boolean actual = preCalculationModelService.looksExponential(x_coordinates, y_coordinates);
        assertFalse(actual);
    }

    @Test
    void testLooksExponential_whenValidCoordinateData_thenReturnTrue(){
        double[] x_coordinates = new double[]{10, 11, 12, 13, 14, 15};
        double[] y_coordinates = new double[]{50.0, 98.0, 195.0, 390.0, 780.0, 1560.0};
        boolean actual = preCalculationModelService.looksExponential(x_coordinates, y_coordinates);
        assertTrue(actual);
    }

    @Test
    void testFitPreCalculationCategoriesByPreCalculationEntries_whenWeeklyPrecalculationEntriesIsEmpty_thenReturnEmptyList(){
        Map<WeekNumber, List<PreCalculationEntry>> weeklyPreCalculationEntries = new HashMap<>();
        List<PreCalculationCategory> actual = preCalculationModelService.createPreCalculationCategoriesForCategoriesByWeekly(weeklyPreCalculationEntries, budgetSchedule);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testFitPreCalculationCategoriesByPreCalculationEntries_whenBudgetScheduleIsNull_thenReturnEmptyList(){
        Map<WeekNumber, List<PreCalculationEntry>> weeklyPreCalculationEntries = new HashMap<>();
        weeklyPreCalculationEntries.put(new WeekNumber(), List.of(new PreCalculationEntry("Gas",new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)), new BigDecimal("40.23"), new BigDecimal("23.45"), EntryType.VARIABLE_EXPENSE )));
        List<PreCalculationCategory> actual = preCalculationModelService.createPreCalculationCategoriesForCategoriesByWeekly(weeklyPreCalculationEntries, null);
        assertTrue(actual.isEmpty());
    }

//    @Test
//    void testFitCategoryCoordinatesToModels_WhenCategoryCoordinatesIsEmpty_thenReturnEmptyList()
//    {
//        Map<String, List<EntryCoordinates>> entryCoordinatesByCategory = new HashMap<>();
//        List<CategoryMathModel> categoryMathModels = preCalculationModelService.fitCategoryCoordinatesToMathModel(entryCoordinatesByCategory);
//        assertTrue(categoryMathModels.isEmpty());
//    }

    @Test
    void testSelectBestModelForPositionType_whenMathModelsIsEmpty_thenReturnEmptyMap(){
        Map<PositionType, List<AbstractMathModel>> mathModelsByPositionType = new HashMap<>();
        Map<PositionType, AbstractMathModel> actual = preCalculationModelService.selectBestModelForPositionType(mathModelsByPositionType);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testSelectBestModelForPositionType_whenMathModelsValid_thenReturnBestModels()
    {
        Map<PositionType, List<AbstractMathModel>> mathModelsByPositionType = new HashMap<>();
        List<AbstractMathModel> bestSavedModels = new ArrayList<>();
        LinearModel savedLinearModel = new LinearModel();
        savedLinearModel.fit(new double[]{10, 11, 12}, new double[]{100, 150, 200});
        QuadraticModel savedQuadraticModel = new QuadraticModel();
        savedQuadraticModel.fit(new double[]{10, 11, 12}, new double[]{100, 150, 200});
        bestSavedModels.add(savedLinearModel);
        bestSavedModels.add(savedQuadraticModel);
        mathModelsByPositionType.put(PositionType.SAVED, bestSavedModels);

        List<AbstractMathModel> bestSpendingModels = new ArrayList<>();
        ExponentialModel spendingExponentialModel = new ExponentialModel();
        spendingExponentialModel.fit(new double[]{10, 11, 12}, new double[]{100, 150, 200});
        bestSpendingModels.add(spendingExponentialModel);

        QuadraticModel spendingQuadraticModel = new QuadraticModel();
        spendingQuadraticModel.fit(new double[]{10, 11, 12}, new double[]{100, 150, 200});
        bestSpendingModels.add(spendingQuadraticModel);
        mathModelsByPositionType.put(PositionType.SPENDING, bestSpendingModels);

        List<AbstractMathModel> bestBudgetedModels = new ArrayList<>();
        ConstantModel budgetedConstantModel = new ConstantModel(3500);
        bestBudgetedModels.add(budgetedConstantModel);

        mathModelsByPositionType.put(PositionType.BUDGETED, bestBudgetedModels);

        List<AbstractMathModel> bestGoalsMetModels = new ArrayList<>();
        LinearModel goalsMetLinearModel = new LinearModel();
        goalsMetLinearModel.fit(new double[]{10, 11, 12}, new double[]{100, 150, 200});

        bestGoalsMetModels.add(goalsMetLinearModel);
        mathModelsByPositionType.put(PositionType.GOALS_MET, bestGoalsMetModels);

        Map<PositionType, AbstractMathModel> expected = new HashMap<>();
        expected.put(PositionType.BUDGETED, budgetedConstantModel);
        expected.put(PositionType.SAVED, savedLinearModel);
        expected.put(PositionType.SPENDING, spendingExponentialModel);
        expected.put(PositionType.GOALS_MET, goalsMetLinearModel);

        Map<PositionType, AbstractMathModel> actual = preCalculationModelService.selectBestModelForPositionType(mathModelsByPositionType);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for (PositionType positionType : mathModelsByPositionType.keySet()) {

            AbstractMathModel expectedModel = expected.get(positionType);
            AbstractMathModel actualModel = actual.get(positionType);
            assertEquals(expectedModel.getEquationString(), actualModel.getEquationString(),
                    "Equation mismatch for " + positionType);

            assertTrue(actual.containsKey(positionType),
                    "Actual result should contain " + positionType);
        }
    }

    @Test
    void testSelectBestModelForPositionType_whenMathModelIsNull_thenThrowException(){
        Map<PositionType, List<AbstractMathModel>> mathModelsByPositionType = new HashMap<>();
        List<AbstractMathModel> bestSavedModels = new ArrayList<>();
        LinearModel savedLinearModel = new LinearModel();
        savedLinearModel.fit(new double[]{10, 11, 12}, new double[]{100, 150, 200});
        QuadraticModel savedQuadraticModel = new QuadraticModel();
        savedQuadraticModel.fit(new double[]{10, 11, 12}, new double[]{100, 150, 200});
        bestSavedModels.add(null);
        bestSavedModels.add(savedQuadraticModel);
        mathModelsByPositionType.put(PositionType.SAVED, bestSavedModels);

        List<AbstractMathModel> bestSpendingModels = new ArrayList<>();
        ExponentialModel spendingExponentialModel = new ExponentialModel();
        spendingExponentialModel.fit(new double[]{10, 11, 12}, new double[]{100, 150, 200});
        bestSpendingModels.add(spendingExponentialModel);

        QuadraticModel spendingQuadraticModel = new QuadraticModel();
        spendingQuadraticModel.fit(new double[]{10, 11, 12}, new double[]{100, 150, 200});
        bestSpendingModels.add(spendingQuadraticModel);
        mathModelsByPositionType.put(PositionType.SPENDING, bestSpendingModels);

        List<AbstractMathModel> bestBudgetedModels = new ArrayList<>();
        ConstantModel budgetedConstantModel = new ConstantModel(3500);
        bestBudgetedModels.add(budgetedConstantModel);

        mathModelsByPositionType.put(PositionType.BUDGETED, bestBudgetedModels);

        List<AbstractMathModel> bestGoalsMetModels = new ArrayList<>();
        LinearModel goalsMetLinearModel = new LinearModel();
        goalsMetLinearModel.fit(new double[]{10, 11, 12}, new double[]{100, 150, 200});

        bestGoalsMetModels.add(goalsMetLinearModel);
        mathModelsByPositionType.put(PositionType.GOALS_MET, bestGoalsMetModels);
        assertThrows(InvalidMathModelException.class, () -> {
            preCalculationModelService.selectBestModelForPositionType(mathModelsByPositionType);
        });
    }

    @Test
    void testFitCategoryCoordinatesToModels_whenCategoryCoordinatesValid_thenReturnCategoryMathModels()
    {
        List<CategoryCoordinates> categoryCoordinatesList = new ArrayList<>();

        // Groceries - Variable expense with varying spending, savings, and goals
        categoryCoordinatesList.add(new CategoryCoordinates("Groceries", 10, 78, 72, 1));    // Week 10: spent $78, saved $22, met 1 goal
        categoryCoordinatesList.add(new CategoryCoordinates("Groceries", 11, 125, 25, 1));    // Week 11: spent $125, no savings, no goals met
        categoryCoordinatesList.add(new CategoryCoordinates("Groceries", 12, 156, -6, 0));    // Week 12: overspent
        categoryCoordinatesList.add(new CategoryCoordinates("Groceries", 13, 105, 45, 1));   // Week 13: spent $105, saved $15
        categoryCoordinatesList.add(new CategoryCoordinates("Groceries", 14, 178, -28, 0));    // Week 14: overspent significantly
        categoryCoordinatesList.add(new CategoryCoordinates("Groceries", 15, 98, 52, 1));    // Week 15: good week, met goal

        // Rent - Fixed expense with some variability (partial payments?)
        categoryCoordinatesList.add(new CategoryCoordinates("Rent", 10, 1200, 0, 1));     // Week 10: full rent paid, goal met
        categoryCoordinatesList.add(new CategoryCoordinates("Rent", 12, 707, 0, 0));      // Week 12: partial payment
        categoryCoordinatesList.add(new CategoryCoordinates("Rent", 14, 1200, 0, 1));     // Week 14: full rent paid, goal met
        categoryCoordinatesList.add(new CategoryCoordinates("Rent", 16, 707, 0, 0));      // Week 16: partial payment

        // Insurance - Fixed expense, consistent payment
        categoryCoordinatesList.add(new CategoryCoordinates("Insurance", 10, 95.23, 0, 0)); // Week 10: insurance paid, goal met

        // Gas - Variable expense with decreasing trend
        categoryCoordinatesList.add(new CategoryCoordinates("Gas", 10, 40.23, 9.77, 0));   // Week 10: spent $40.23, saved $9.77
        categoryCoordinatesList.add(new CategoryCoordinates("Gas", 11, 35.02, 14.98, 1));  // Week 11: spent $35.02, saved $14.98, met goal
        categoryCoordinatesList.add(new CategoryCoordinates("Gas", 12, 15.23, 34.77, 1));  // Week 12: low spending, high savings, goal met

        List<CategoryMathModel> expectedCategoryMathModels = new ArrayList<>();

        // Gas - Clear trends in the data
        CategoryMathModel gasMathModel = new CategoryMathModel();
        gasMathModel.setCategory("Gas");
        LinearModel spendingLinearModel = new LinearModel();
        spendingLinearModel.fit(new double[]{10, 11, 12}, new double[]{40.23, 35.02, 15.23});
        gasMathModel.setSpendingModel(spendingLinearModel); // Clear downward trend: 40.23 → 35.02 → 15.23
        LinearModel savingsLinearModel = new LinearModel();
        savingsLinearModel.fit(new double[]{10, 11, 12}, new double[]{9.77, 14.98, 34.77}); // Correct values
        gasMathModel.setSavingsModel(savingsLinearModel); // Clear upward trend: 9.77 → 14.98 → 34.77
        LinearModel goalsMetLinearModel = new LinearModel();
        goalsMetLinearModel.fit(new double[]{10, 11, 12}, new double[]{0, 1, 1}); // Use actual goals data
        gasMathModel.setGoalsReachedModel(goalsMetLinearModel); // Binary trend: 0 → 1 → 1 (best fit with linear)
        expectedCategoryMathModels.add(gasMathModel);

        // Groceries - Variable expense with high volatility and non-linear patterns
        CategoryMathModel groceriesMathModel = new CategoryMathModel();
        groceriesMathModel.setCategory("Groceries");
        QuadraticModel spendingPolynomialModel = new QuadraticModel();
        spendingPolynomialModel.fit(new double[]{10, 11, 12, 13, 14, 15}, new double[]{78, 125, 156, 105, 178, 98});
        groceriesMathModel.setSpendingModel(spendingPolynomialModel); // Volatile pattern needs higher-degree polynomial
        QuadraticModel savingsQuadraticModel = new QuadraticModel();
        savingsQuadraticModel.fit(new double[]{10, 11, 12, 13, 14, 15}, new double[]{72, 25, -6, 45, -28, 52});
        groceriesMathModel.setSavingsModel(savingsQuadraticModel); // Savings pattern has some curvature

        QuadraticModel goalsReachedPolynomialModel = new QuadraticModel();
        goalsReachedPolynomialModel.fit(new double[]{10, 11, 12, 13, 14, 15}, new double[]{1, 1, 0, 1, 0, 1});
        groceriesMathModel.setGoalsReachedModel(goalsReachedPolynomialModel); // Simple linear relationship for binary goals
        expectedCategoryMathModels.add(groceriesMathModel);

        // Rent - Fixed expense with alternating pattern
        CategoryMathModel rentMathModel = new CategoryMathModel();
        rentMathModel.setCategory("Rent");
        QuadraticModel spendingQuadraticModel = new QuadraticModel();
        spendingQuadraticModel.fit(new double[]{10, 12, 14, 16}, new double[]{1200, 707, 1200, 707});
        rentMathModel.setSpendingModel(spendingQuadraticModel); // Alternating pattern requires higher-degree polynomial
        QuadraticModel rentSavingsQuadraticModel = new QuadraticModel();
        rentSavingsQuadraticModel.fit(new double[]{10, 12, 14, 16}, new double[]{0, 0, 0, 0});
        rentMathModel.setSavingsModel(rentSavingsQuadraticModel); // Always 0, so linear (flat line)
        QuadraticModel rentGoalsReachedModel = new QuadraticModel();
        rentGoalsReachedModel.fit(new double[]{10, 12, 14, 16}, new double[]{1, 0, 1, 0});
        rentMathModel.setGoalsReachedModel(rentGoalsReachedModel); // Quadratic to capture alternating goal achievement
        expectedCategoryMathModels.add(rentMathModel);

        // Insurance - Fixed expense, single data point
        CategoryMathModel insuranceMathModel = new CategoryMathModel();
        insuranceMathModel.setCategory("Insurance");
        ConstantModel insuranceSpendingModel = new ConstantModel(95.23);
        insuranceMathModel.setSpendingModel(insuranceSpendingModel); // Single point, linear will create flat line
        insuranceMathModel.setSavingsModel(new ConstantModel(0)); // Always 0, linear flat line
        insuranceMathModel.setGoalsReachedModel(new ConstantModel(0)); // Always 1, linear flat line
        expectedCategoryMathModels.add(insuranceMathModel);

        List<CategoryMathModel> actual = preCalculationModelService.fitCategoryCoordinatesToMathModel(categoryCoordinatesList);

        assertNotNull(actual);
        assertEquals(expectedCategoryMathModels.size(), actual.size());

        // Sort both lists by category name for consistent comparison
        expectedCategoryMathModels.sort(Comparator.comparing(CategoryMathModel::getCategory));
        actual.sort(Comparator.comparing(CategoryMathModel::getCategory));

        for(int i = 0; i < expectedCategoryMathModels.size(); i++)
        {
            CategoryMathModel expectedCategoryMathModel = expectedCategoryMathModels.get(i);
            CategoryMathModel actualCategoryMathModel = actual.get(i);
            System.out.println("Category: " + expectedCategoryMathModel.getCategory());
            System.out.println("Spending Model: " + (expectedCategoryMathModel.getSpendingModel() != null ? expectedCategoryMathModel.getSpendingModel().getClass().getSimpleName() : "null"));
            System.out.println("Savings Model: " + (expectedCategoryMathModel.getSavingsModel() != null ? expectedCategoryMathModel.getSavingsModel().getClass().getSimpleName() : "null"));
            System.out.println("Goals Model: " + (expectedCategoryMathModel.getGoalsReachedModel() != null ? expectedCategoryMathModel.getGoalsReachedModel().getClass().getSimpleName() : "null"));
            System.out.println("---");

            System.out.println("Actual Category MathModel");
            System.out.println("Category: " + actualCategoryMathModel.getCategory());
            System.out.println("Spending Model: " + (actualCategoryMathModel.getSpendingModel() != null ? actualCategoryMathModel.getSpendingModel().getClass().getSimpleName() : "null"));
            System.out.println("Savings Model: " + (actualCategoryMathModel.getSavingsModel() != null ? actualCategoryMathModel.getSavingsModel().getClass().getSimpleName() : "null"));
            System.out.println("Goals Model: " + (actualCategoryMathModel.getGoalsReachedModel() != null ? actualCategoryMathModel.getGoalsReachedModel().getClass().getSimpleName() : "null"));
            System.out.println("---");

            assertEquals(expectedCategoryMathModel.getCategory(), actualCategoryMathModel.getCategory(),
                    "Category mismatch at index: " + i);
            assertEquals(expectedCategoryMathModel.getSpendingModel().getEquationString(),
                    actualCategoryMathModel.getSpendingModel().getEquationString(),
                    "Spending model mismatch for category: " + expectedCategoryMathModel.getCategory());
            assertEquals(expectedCategoryMathModel.getSavingsModel().getEquationString(),
                    actualCategoryMathModel.getSavingsModel().getEquationString(),
                    "Savings model mismatch for category: " + expectedCategoryMathModel.getCategory());
            assertEquals(expectedCategoryMathModel.getGoalsReachedModel().getEquationString(),
                    actualCategoryMathModel.getGoalsReachedModel().getEquationString(),
                    "Goals reached model mismatch for category: " + expectedCategoryMathModel.getCategory());
//            assertEquals(expectedCategoryMathModel.getAllocatedAmountModel().getEquationString(),
//                    actualCategoryMathModel.getAllocatedAmountModel().getEquationString(),
//                    "Allocated amount model mismatch for category: " + expectedCategoryMathModel.getCategory());
        }
    }


    @Test
    void testConvertWeeklyPreCalculationEntriesToCategoryCoordinates_whenWeeklyCategoryEntriesIsEmpty_thenReturnEmptyList(){
        Map<WeekNumber, List<PreCalculationEntry>> weeklyCategoryEntries = new HashMap<>();
        List<CategoryCoordinates> actual = preCalculationModelService.convertWeeklyPrecalculationEntriesToCategoryCoordinates(weeklyCategoryEntries, subBudgetGoals);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testConvertWeeklyPreCalculationEntriesToEntryCoordinates_whenWeeklyCategoryEntriesValid_thenReturnEntryCoordinatesByCategory(){
        // Arrange
        Map<WeekNumber, List<PreCalculationEntry>> weeklyPrecalculationEntries = new HashMap<>();
        // Week 10 - March 1-7, 2025
        List<PreCalculationEntry> week10Entries = new ArrayList<>();
        DateRange week10Range = new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 7));
        week10Entries.add(new PreCalculationEntry(
                "Rent",
                week10Range,
                new BigDecimal("1200"), // budgeted
                new BigDecimal("1200"), // actual
                EntryType.FIXED_EXPENSE
        ));
        week10Entries.add(new PreCalculationEntry(
                "Groceries",
                week10Range,
                new BigDecimal("150"), // budgeted
                new BigDecimal("120"), // actual
                EntryType.VARIABLE_EXPENSE
        ));
        weeklyPrecalculationEntries.put(new WeekNumber(10, 2025, week10Range), week10Entries);

        // Week 11 - March 8-14, 2025
        List<PreCalculationEntry> week11Entries = new ArrayList<>();
        DateRange week11Range = new DateRange(LocalDate.of(2025, 3, 8), LocalDate.of(2025, 3, 14));
        week11Entries.add(new PreCalculationEntry(
                "Groceries",
                week11Range,
                new BigDecimal("150"), // budgeted
                new BigDecimal("135"), // actual
                EntryType.VARIABLE_EXPENSE
        ));
        week11Entries.add(new PreCalculationEntry(
                "Gas",
                week11Range,
                new BigDecimal("80"), // budgeted
                new BigDecimal("75"), // actual
                EntryType.VARIABLE_EXPENSE
        ));
        weeklyPrecalculationEntries.put(new WeekNumber(11, 2025, week11Range), week11Entries);

        // Week 12 - March 15-21, 2025
        List<PreCalculationEntry> week12Entries = new ArrayList<>();
        DateRange week12Range = new DateRange(LocalDate.of(2025, 3, 15), LocalDate.of(2025, 3, 21));
        week12Entries.add(new PreCalculationEntry(
                "Groceries",
                week12Range,
                new BigDecimal("150"), // budgeted
                new BigDecimal("160"), // actual (over budget)
                EntryType.VARIABLE_EXPENSE
        ));
        week12Entries.add(new PreCalculationEntry(
                "Entertainment",
                week12Range,
                new BigDecimal("100"), // budgeted
                new BigDecimal("85"), // actual
                EntryType.VARIABLE_EXPENSE
        ));
        weeklyPrecalculationEntries.put(new WeekNumber(12, 2025, week12Range), week12Entries);

        // Week 13 - March 22-28, 2025
        List<PreCalculationEntry> week13Entries = new ArrayList<>();
        DateRange week13Range = new DateRange(LocalDate.of(2025, 3, 22), LocalDate.of(2025, 3, 28));
        week13Entries.add(new PreCalculationEntry(
                "Groceries",
                week13Range,
                new BigDecimal("150"), // budgeted
                new BigDecimal("140"), // actual
                EntryType.VARIABLE_EXPENSE
        ));
        week13Entries.add(new PreCalculationEntry(
                "Gas",
                week13Range,
                new BigDecimal("80"), // budgeted
                new BigDecimal("82"), // actual
                EntryType.VARIABLE_EXPENSE
        ));
        week13Entries.add(new PreCalculationEntry(
                "Utilities",
                week13Range,
                new BigDecimal("200"), // budgeted
                new BigDecimal("180"), // actual
                EntryType.FIXED_EXPENSE
        ));
        weeklyPrecalculationEntries.put(new WeekNumber(13, 2025, week13Range), week13Entries);

        // Week 14 - March 29-31, 2025 (partial week)
        List<PreCalculationEntry> week14Entries = new ArrayList<>();
        DateRange week14Range = new DateRange(LocalDate.of(2025, 3, 29), LocalDate.of(2025, 3, 31));
        week14Entries.add(new PreCalculationEntry(
                "Groceries",
                week14Range,
                new BigDecimal("50"), // budgeted (partial week)
                new BigDecimal("45"), // actual
                EntryType.VARIABLE_EXPENSE
        ));
        weeklyPrecalculationEntries.put(new WeekNumber(14, 2025, week14Range), week14Entries);

        // Create SubBudgetGoals - need to set this up for the calculation
        // Assuming total savings target of $100 for 5 weeks = $20 per week
        SubBudgetGoals subBudgetGoals = new SubBudgetGoals();
        subBudgetGoals.setSavingsTarget(new BigDecimal("100.00")); // $100 total target

        // Calculate weekly savings goal: $100 / 5 weeks = $20 per week
        BigDecimal weeklySavingsGoal = new BigDecimal("20.00");

        // Expected results - calculating based on the actual logic:
        // saved = budgeted - actual
        // goalSaved = weeklySavingGoals - saved (gap to reach weekly goal)
        List<CategoryCoordinates> expected = new ArrayList<>();

        // Week 10
        expected.add(new CategoryCoordinates("Rent", 10, 1200, 0, 20.0)); // saved = 0, goalSaved = 20-0 = 20
        expected.add(new CategoryCoordinates("Groceries", 10, 120, 30, -10.0)); // saved = 30, goalSaved = 20-30 = -10

        // Week 11
        expected.add(new CategoryCoordinates("Groceries", 11, 135, 15, 5.0)); // saved = 15, goalSaved = 20-15 = 5
        expected.add(new CategoryCoordinates("Gas", 11, 75, 5, 15.0)); // saved = 5, goalSaved = 20-5 = 15

        // Week 12
        expected.add(new CategoryCoordinates("Groceries", 12, 160, -10, 30.0)); // saved = -10, goalSaved = 20-(-10) = 30
        expected.add(new CategoryCoordinates("Entertainment", 12, 85, 15, 5.0)); // saved = 15, goalSaved = 20-15 = 5

        // Week 13
        expected.add(new CategoryCoordinates("Groceries", 13, 140, 10, 10.0)); // saved = 10, goalSaved = 20-10 = 10
        expected.add(new CategoryCoordinates("Gas", 13, 82, -2, 22.0)); // saved = -2, goalSaved = 20-(-2) = 22
        expected.add(new CategoryCoordinates("Utilities", 13, 180, 20, 0.0)); // saved = 20, goalSaved = 20-20 = 0

        // Week 14
        expected.add(new CategoryCoordinates("Groceries", 14, 45, 5, 15.0)); // saved = 5, goalSaved = 20-5 = 15

        // Act
        List<CategoryCoordinates> actual = preCalculationModelService
                .convertWeeklyPrecalculationEntriesToCategoryCoordinates(weeklyPrecalculationEntries, subBudgetGoals);

        // Assert
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());

        // Sort both lists by week number, then by category name for consistent comparison
        Comparator<CategoryCoordinates> comparator = Comparator
                .comparing(CategoryCoordinates::getX) // Sort by week number first
                .thenComparing(CategoryCoordinates::getCategory); // Then by category name

        expected.sort(comparator);
        actual.sort(comparator);

        for (int i = 0; i < expected.size(); i++) {
            CategoryCoordinates expectedCoord = expected.get(i);
            CategoryCoordinates actualCoord = actual.get(i);

            assertEquals(expectedCoord.getCategory(), actualCoord.getCategory(),
                    "Category name mismatch at index: " + i);
            assertEquals(expectedCoord.getX(), actualCoord.getX(),
                    "X coordinate (week number) mismatch for " + expectedCoord.getCategory());
            assertEquals(expectedCoord.getY(), actualCoord.getY(), 0.001,
                    "Y coordinate (weekly spending) mismatch for " + expectedCoord.getCategory());
            assertEquals(expectedCoord.getZ(), actualCoord.getZ(), 0.001,
                    "Z coordinate (weekly savings) mismatch for " + expectedCoord.getCategory());
            assertEquals(expectedCoord.getW(), actualCoord.getW(), 0.001,
                    "W coordinate (weekly goal met) mismatch for " + expectedCoord.getCategory());

            // Alternative: Use the equals method
            // assertEquals(expectedCoord, actualCoord,
            //         "CategoryCoordinates mismatch for " + expectedCoord.getCategory() + " at week " + expectedCoord.getX());
        }

    }

    @Test
    void testFitPreCalculationCategoriesByPreCalculationEntries_whenValidData_thenReturnPreCalculationCategories()
    {
        Map<WeekNumber, List<PreCalculationEntry>> weeklyPreCalculations = new HashMap<>();
        DateRange week1DateRange = new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 2));
        WeekNumber weekNumber1 = new WeekNumber(9, 2025, week1DateRange);
        PreCalculationEntry week1GasEntry = new PreCalculationEntry("Gas", week1DateRange, new BigDecimal("40.23"), new BigDecimal("23.45"), EntryType.VARIABLE_EXPENSE);
        PreCalculationEntry week1RentEntry = new PreCalculationEntry("Rent", week1DateRange, new BigDecimal("1200.0"), new BigDecimal("1200.0"), EntryType.FIXED_EXPENSE);
        PreCalculationEntry week1FoodEntry = new PreCalculationEntry("Groceries", week1DateRange, new BigDecimal("160"), new BigDecimal("145"), EntryType.FIXED_EXPENSE);
        List<PreCalculationEntry> week1PreCalculations = new ArrayList<>();
        week1PreCalculations.add(week1GasEntry);
        week1PreCalculations.add(week1RentEntry);
        week1PreCalculations.add(week1FoodEntry);

        DateRange week2DateRange = new DateRange(LocalDate.of(2025, 3, 3), LocalDate.of(2025, 3, 9));
        WeekNumber weekNumber2 = new WeekNumber(10, 2025, week2DateRange);
        PreCalculationEntry week2GroceriesEntry = new PreCalculationEntry("Groceries", week2DateRange, new BigDecimal("160"), new BigDecimal("125.35"), EntryType.VARIABLE_EXPENSE);
        PreCalculationEntry week2PaymentsEntry = new PreCalculationEntry("Payments", week2DateRange, new BigDecimal("150.32"), new BigDecimal("90.60"), EntryType.FIXED_EXPENSE);
        PreCalculationEntry week2Subscriptions = new PreCalculationEntry("Subscriptions", week2DateRange, new BigDecimal("250"), new BigDecimal("50.02"), EntryType.FIXED_EXPENSE);
        PreCalculationEntry week2GasEntry = new PreCalculationEntry("Gas", week2DateRange, new BigDecimal("40.23"), new BigDecimal("35.02"), EntryType.VARIABLE_EXPENSE);
        List<PreCalculationEntry> week2PreCalculations = new ArrayList<>();
        week2PreCalculations.add(week2GroceriesEntry);
        week2PreCalculations.add(week2PaymentsEntry);
        week2PreCalculations.add(week2Subscriptions);
        week2PreCalculations.add(week2GasEntry);

        DateRange week3DateRange = new DateRange(LocalDate.of(2025, 3, 10), LocalDate.of(2025, 3, 16));
        WeekNumber weekNumber3 = new WeekNumber(11, 2025, week3DateRange);
        PreCalculationEntry week3GroceriesEntry = new PreCalculationEntry("Groceries", week3DateRange, new BigDecimal("160"), new BigDecimal("115.23"), EntryType.VARIABLE_EXPENSE);
        PreCalculationEntry week3RentEntry = new PreCalculationEntry("Rent", week3DateRange, new BigDecimal("707.0"), new BigDecimal("707.0"), EntryType.FIXED_EXPENSE);
        PreCalculationEntry insuranceEntry = new PreCalculationEntry("Insurance", week3DateRange, new BigDecimal("95.23"), new BigDecimal("80.25"), EntryType.FIXED_EXPENSE);
        PreCalculationEntry week3GasEntry = new PreCalculationEntry("Gas", week3DateRange, new BigDecimal("40.23"), new BigDecimal("18.35"), EntryType.VARIABLE_EXPENSE);
        List<PreCalculationEntry> week3PreCalculations = new ArrayList<>();
        week3PreCalculations.add(week3GroceriesEntry);
        week3PreCalculations.add(week3RentEntry);
        week3PreCalculations.add(insuranceEntry);
        week3PreCalculations.add(week3GasEntry);

        DateRange week4DateRange = new DateRange(LocalDate.of(2025, 3, 17), LocalDate.of(2025, 3, 23));
        WeekNumber weekNumber4 = new WeekNumber(12, 2025, week4DateRange);
        PreCalculationEntry week4GroceriesEntry = new PreCalculationEntry("Groceries", week4DateRange, new BigDecimal("160"), new BigDecimal("105.23"), EntryType.VARIABLE_EXPENSE);
        PreCalculationEntry week4GasEntry = new PreCalculationEntry("Gas", week4DateRange, new BigDecimal("40.23"), new BigDecimal("23.45"), EntryType.VARIABLE_EXPENSE);
        PreCalculationEntry paymentsEntry = new PreCalculationEntry("Payments", week4DateRange, new BigDecimal("150.32"), new BigDecimal("35.23"), EntryType.FIXED_EXPENSE);
        PreCalculationEntry subscriptionsEntry = new PreCalculationEntry("Subscriptions", week4DateRange, new BigDecimal("250"), new BigDecimal("65.23"), EntryType.FIXED_EXPENSE);
        List<PreCalculationEntry> week4PreCalculations = new ArrayList<>();
        week4PreCalculations.add(week4GroceriesEntry);
        week4PreCalculations.add(week4GasEntry);
        week4PreCalculations.add(paymentsEntry);
        week4PreCalculations.add(subscriptionsEntry);

        weeklyPreCalculations.put(weekNumber1, week1PreCalculations);
        weeklyPreCalculations.put(weekNumber2, week2PreCalculations);
        weeklyPreCalculations.put(weekNumber3, week3PreCalculations);
        weeklyPreCalculations.put(weekNumber4, week4PreCalculations);

        // Get the actual results from the service method
//        List<PreCalculationCategory> actual = preCalculationModelService.createPreCalculationCategoriesForCategoriesByWeekly(weeklyPreCalculations, budgetSchedule, 1L);
//
//        assertNotNull(actual, "Result should not be null");

//        // Sort results by category name for consistent comparison
//        actual.sort(Comparator.comparing(pc -> pc.mathModel().getClass().getSimpleName()));
//
//        // Verify we have the expected categories
//        Set<String> expectedCategories = Set.of("Groceries", "Gas", "Rent", "Payments", "Subscriptions");
//        Set<String> actualCategories = actual.stream()
//                .map(PreCalculationCategory::category)
//                .collect(Collectors.toSet());
//
//        assertEquals(expectedCategories.size(), actualCategories.size(), "Should have all expected categories");
//        assertTrue(actualCategories.containsAll(expectedCategories), "All expected categories should be present");
//
//        // Verify each PreCalculationCategory has valid components
//        for (PreCalculationCategory preCalcCategory : actual) {
//            // Verify CategoryMathModel
//            assertNotNull(preCalcCategory.mathModel(), "Math model should not be null");
//            assertNotNull(preCalcCategory.category(), "Category name should not be null");
//            assertNotNull(preCalcCategory.mathModel().getEquationString(), "Equation string should not be null");
//        }

    }



    @AfterEach
    void tearDown() {
    }
}