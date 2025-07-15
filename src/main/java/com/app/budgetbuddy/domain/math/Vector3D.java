package com.app.budgetbuddy.domain.math;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Vector3D
{
    private double x;
    private double y;
    private double z;

    public Vector3D(double x, double y, double z)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public double calculateMagnitude()
    {
        return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
    }
}
