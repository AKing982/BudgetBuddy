package com.app.budgetbuddy.domain.math;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.function.BiFunction;

import static org.junit.Assert.assertEquals;

class PartialDerivativeTest
{

    private double[][] testPoints = {
            {1.0, 2.0},
            {2.0, 1.0},
            {0.0, 0.0},
            {-1.0, 2.0}
    };

    @BeforeEach
    void setUp() {
    }
//
//    @Test
//    void testPartialDerivativeWithRespectToX_firstOrder(){
//        BiFunction<Double, Double, Double> f = (x, t) -> x * x * t;
//        double x = 2.0;
//        double t = 3.0;
//        int order = 1;
//        double h = 1e-5;
//
//        PartialDerivative pd = new PartialDerivative(x, t, order);
//        System.out.println(pd.toString());
//        double result = pd.evaluateAtX(f, x, t, h);
//        Assertions.assertEquals(12.0, result, 1e-4);
//    }
//
//    @Test
//    void testPartialDerivativeWithRespectToX_firstOrderFunction(){
//        BiFunction<Double, Double, Double> f = (x, t) -> 2*x*x + 3*x*t + 4;
//        int order = 1;
//        double h = 1e-5;
//
//        BiFunction<Double, Double, Double> f_partial = (x, t) -> 4*x + 3*t;
//        PartialDerivative pd = new PartialDerivative(order);
//        System.out.println(pd.toString());
//        BiFunction<Double, Double, Double> dfdx_numerical = pd.withRespectToX(f, h);
//        for(double[] testPoint : testPoints){
//            double x = testPoint[0];
//            double t = testPoint[1];
//            double expected = f_partial.apply(x, t);
//            double actual = dfdx_numerical.apply(x, t);
//            Assertions.assertEquals(expected, actual, 1e-4);
//        }
//    }


    @AfterEach
    void tearDown() {
    }
}