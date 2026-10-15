package com.app.budgetbuddy.domain;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@Builder
public class BucketPlanItem
{
    private Long id;
    private Long bucketPlanId;
    private String itemName;
    private LocalDate datePurchased;
    private LocalDate datePlanned;
    private double amount;
    private String category;
    private boolean isModified;
    private boolean isActive;

    public BucketPlanItem(Long id, Long bucketPlanId, String itemName, LocalDate datePurchased, LocalDate datePlanned, double amount, String category, boolean isModified, boolean isActive) {
        this.id = id;
        this.bucketPlanId = bucketPlanId;
        this.itemName = itemName;
        this.datePurchased = datePurchased;
        this.datePlanned = datePlanned;
        this.amount = amount;
        this.category = category;
        this.isModified = isModified;
        this.isActive = isActive;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        BucketPlanItem that = (BucketPlanItem) o;
        return Double.compare(amount, that.amount) == 0 && isModified == that.isModified && isActive == that.isActive && Objects.equals(id, that.id) && Objects.equals(bucketPlanId, that.bucketPlanId) && Objects.equals(itemName, that.itemName) && Objects.equals(datePurchased, that.datePurchased) && Objects.equals(datePlanned, that.datePlanned) && Objects.equals(category, that.category);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, bucketPlanId, itemName, datePurchased, datePlanned, amount, category, isModified, isActive);
    }

    @Override
    public String toString() {
        return "BucketPlanItem{" +
                "id=" + id +
                ", bucketPlanId=" + bucketPlanId +
                ", itemName='" + itemName + '\'' +
                ", datePurchased=" + datePurchased +
                ", datePlanned=" + datePlanned +
                ", amount=" + amount +
                ", category='" + category + '\'' +
                ", isModified=" + isModified +
                ", isActive=" + isActive +
                '}';
    }
}
