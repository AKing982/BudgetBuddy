package com.app.budgetbuddy.domain;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@Builder
public class BucketPlans
{
    private Long id;
    private String bucketName;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double budgetedAmount;
    private Double actualAmount;
    private Double plannedAmount;
    private boolean isActive;
    private List<BucketPlanItem> bucketPlanItems = new ArrayList<>();

    public BucketPlans(Long id, String bucketName, LocalDate startDate, LocalDate endDate, Double budgetedAmount, Double actualAmount, Double plannedAmount, boolean isActive, List<BucketPlanItem> bucketPlanItems) {
        this.id = id;
        this.bucketName = bucketName;
        this.startDate = startDate;
        this.endDate = endDate;
        this.budgetedAmount = budgetedAmount;
        this.actualAmount = actualAmount;
        this.plannedAmount = plannedAmount;
        this.isActive = isActive;
        this.bucketPlanItems = bucketPlanItems;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        BucketPlans that = (BucketPlans) o;
        return isActive == that.isActive && Objects.equals(id, that.id) && Objects.equals(bucketName, that.bucketName) && Objects.equals(startDate, that.startDate) && Objects.equals(endDate, that.endDate) && Objects.equals(budgetedAmount, that.budgetedAmount) && Objects.equals(actualAmount, that.actualAmount) && Objects.equals(plannedAmount, that.plannedAmount) && Objects.equals(bucketPlanItems, that.bucketPlanItems);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, bucketName, startDate, endDate, budgetedAmount, actualAmount, plannedAmount, isActive, bucketPlanItems);
    }

    @Override
    public String toString() {
        return "BucketPlans{" +
                "id=" + id +
                ", bucketName='" + bucketName + '\'' +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                ", budgetedAmount=" + budgetedAmount +
                ", actualAmount=" + actualAmount +
                ", plannedAmount=" + plannedAmount +
                ", isActive=" + isActive +
                ", bucketPlanItems=" + bucketPlanItems +
                '}';
    }
}
