package com.app.budgetbuddy.domain.math;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

@Getter
@Setter
@Slf4j
public class Matrix
{
    private double[][] matrix;
    private int rows;
    private int cols;

    public Matrix(int rows, int cols)
    {
        this.rows = rows;
        this.cols = cols;
        this.matrix = new double[rows][cols];
    }

    public double[][] getIdentityMatrix()
    {
        if(rows != cols)
        {
            throw new IllegalArgumentException("Identity matrix must be square (rows == cols)");
        }
        double[][] identity = new double[rows][cols];
        for(int i = 0; i < rows; i++)
        {
            identity[i][i] = 1.0;
        }
        return identity;
    }

    public double[][] getZeroMatrix()
    {
        if(rows != cols)
        {
            throw new IllegalArgumentException("Zero matrix must be square (rows == cols)");
        }
        for(int i = 0; i < rows; i++)
        {
            for(int j = 0; j < cols; j++)
            {
                matrix[i][j] = 0.0;
            }
        }
        return matrix;
    }

    public double[][] setMatrix(double[][] entries)
    {
        double[][] zero_matrix = getZeroMatrix();
        if(entries.length != rows || entries[0].length != cols)
        {
            throw new IllegalArgumentException("Matrix dimensions do not match");
        }
        try
        {
            for(int i = 0; i < rows; i++)
            {
                for(int j = 0; j < cols; j++)
                {
                    matrix[i][j] = entries[i][j];
                }
            }
        }catch(ArithmeticException ex)
        {
            log.error("There was an error setting the matrix: ", ex);
            return zero_matrix;
        }
        return matrix;
    }

}
