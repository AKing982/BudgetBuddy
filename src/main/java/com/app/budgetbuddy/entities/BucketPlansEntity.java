package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

@Entity
@Table(name="bucketPlans")
@Getter
@Setter
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@Builder
public class BucketPlansEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="name")
    private String name;

    @Column(name="start_date")
    private String startDate;

    @Column(name="end_date")
    private String endDate;

    @Column(name="budgeted")
    private double budgeted;

    @Column(name="total_spent")
    private double totalSpent;

    @Column(name="total_planned")
    private double totalPlanned;

    @Column(name="is_active")
    private Boolean isActive;

    @OneToMany(fetch=FetchType.LAZY)
    private Set<BucketPlanItemEntity> bucketPlanItems = new HashSet<>();

    public BucketPlansEntity(Long id, String name, String startDate, String endDate, double budgeted, double totalSpent, double totalPlanned, Boolean isActive, Set<BucketPlanItemEntity> bucketPlanItems) {
        this.id = id;
        this.name = name;
        this.startDate = startDate;
        this.endDate = endDate;
        this.budgeted = budgeted;
        this.totalSpent = totalSpent;
        this.totalPlanned = totalPlanned;
        this.isActive = isActive;
        this.bucketPlanItems = bucketPlanItems;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        BucketPlansEntity that = (BucketPlansEntity) o;
        return Double.compare(budgeted, that.budgeted) == 0 && Double.compare(totalSpent, that.totalSpent) == 0 && Double.compare(totalPlanned, that.totalPlanned) == 0 && Objects.equals(id, that.id) && Objects.equals(name, that.name) && Objects.equals(startDate, that.startDate) && Objects.equals(endDate, that.endDate) && Objects.equals(isActive, that.isActive) && Objects.equals(bucketPlanItems, that.bucketPlanItems);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, name, startDate, endDate, budgeted, totalSpent, totalPlanned, isActive, bucketPlanItems);
    }

    @Override
    public String toString() {
        return "BucketPlansEntity{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", startDate='" + startDate + '\'' +
                ", endDate='" + endDate + '\'' +
                ", budgeted=" + budgeted +
                ", totalSpent=" + totalSpent +
                ", totalPlanned=" + totalPlanned +
                ", isActive=" + isActive +
                ", bucketPlanItems=" + bucketPlanItems +
                '}';
    }
}

