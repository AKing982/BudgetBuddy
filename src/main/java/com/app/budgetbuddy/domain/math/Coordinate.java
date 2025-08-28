package com.app.budgetbuddy.domain.math;

import lombok.Getter;

import java.util.List;

@Getter
public class Coordinate
{
    private double x;
    private double y;
    private double z;
    private double w;

    public Coordinate(double x, double y)
    {
        this.x = x;
        this.y = y;
    }

    public Coordinate(double x, double y, double z, double w)
    {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    public Coordinate(double x, double y, double z)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    @Override
    public String toString() {
        return String.format("(%.1f, %.1f)", x, y);
    }
}
