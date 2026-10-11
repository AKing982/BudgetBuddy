package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Objects;

@Getter
@Setter
@Entity
@Table(name="bucketPlanItems")
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@Builder
public class BucketPlanItemEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="bucketPlanId")
    private BucketPlansEntity bucketPlan;

    @Column(name="item_name")
    private String itemName;

    @Column(name="category")
    private String category;

    @Column(name="date_purchased")
    private LocalDate datePurchased;

    @Column(name="date_planned")
    private LocalDate datePlanned;

    @Column(name="amount")
    private Double amount;

    @Column(name="is_modified")
    private Boolean isModified;

    @Column(name="is_active")
    private Boolean isActive;

    public BucketPlanItemEntity(Long id, BucketPlansEntity bucketPlan, String itemName, String category, LocalDate datePurchased, LocalDate datePlanned, Double amount, Boolean isModified, Boolean isActive) {
        this.id = id;
        this.bucketPlan = bucketPlan;
        this.itemName = itemName;
        this.category = category;
        this.datePurchased = datePurchased;
        this.datePlanned = datePlanned;
        this.amount = amount;
        this.isModified = isModified;
        this.isActive = isActive;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        BucketPlanItemEntity that = (BucketPlanItemEntity) o;
        return Objects.equals(id, that.id) && Objects.equals(bucketPlan, that.bucketPlan) && Objects.equals(itemName, that.itemName) && Objects.equals(category, that.category) && Objects.equals(datePurchased, that.datePurchased) && Objects.equals(datePlanned, that.datePlanned) && Objects.equals(amount, that.amount) && Objects.equals(isModified, that.isModified) && Objects.equals(isActive, that.isActive);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, bucketPlan, itemName, category, datePurchased, datePlanned, amount, isModified, isActive);
    }

    @Override
    public String toString() {
        return "BucketPlanItemEntity{" +
                "id=" + id +
                ", bucketPlan=" + bucketPlan +
                ", itemName='" + itemName + '\'' +
                ", category='" + category + '\'' +
                ", datePurchased=" + datePurchased +
                ", datePlanned=" + datePlanned +
                ", amount=" + amount +
                ", isModified=" + isModified +
                ", isActive=" + isActive +
                '}';
    }
}
