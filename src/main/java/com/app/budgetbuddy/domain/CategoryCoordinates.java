package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Objects;

@NoArgsConstructor(access= AccessLevel.PUBLIC)
@Getter
@Setter
public class CategoryCoordinates
{
    private int x;  // X-axis: Week Number
    private double y;  // Y-axis: Weekly Spending Amount
    private double z;  // Z-axis: Weekly Savings Amount
    private double w;  // W-axis: Weekly Goal Met amount

    private String category; // Name of the category

    public CategoryCoordinates(String category, int weekNumber, double weeklySpending, double weeklySaved, double weeklyGoalMet)
    {
        this.category = category;
        this.x = weekNumber;
        this.y = weeklySpending;
        this.z = weeklySaved;
        this.w = weeklyGoalMet;
    }

    public double[] getCoordinateVector()
    {
        return new double[]{x, y, z, w};
    }

    public double getDistanceFromOrigin(){
        return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2) + Math.pow(w, 2));
    }

    public double getDistanceFrom(CategoryCoordinates other)
    {
        double dx = other.getX() - this.getX();
        double dy = other.getY() - this.getY();
        double dz = other.getZ() - this.getZ();
        double dw = other.getW() - this.getW();

        return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2) + Math.pow(dz, 2) + Math.pow(dw, 2));
    }

    @Override
    public String toString() {
        return String.format("%s: (x=%d, y=%.2f, z=%.2f, w=%.2f)",
                category, x, y, z, w);
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof CategoryCoordinates)) return false;
        CategoryCoordinates other = (CategoryCoordinates) obj;
        return this.x == other.x &&
                Double.compare(this.y, other.y) == 0 &&
                Double.compare(this.z, other.z) == 0 &&
                Double.compare(this.w, other.w) == 0 &&
                this.category.equals(other.category);
    }

    @Override
    public int hashCode() {
        return Objects.hash(category, x, y, z, w);
    }
}
