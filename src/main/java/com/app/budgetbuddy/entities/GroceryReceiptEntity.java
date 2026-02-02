package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name="groceryReceipts")
@Getter
@Setter
public class GroceryReceiptEntity
{
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="groceryBudgetId")
    private GroceryBudgetEntity groceryBudget;

    @Column(name="description")
    private String description;

    @Column(name="storeName")
    private String storeName;

    @Column(name="merchantName")
    private String merchantName;

    @Column(name="address")
    private String address;

    @Column(name="date")
    private LocalDate date;

    @Column(name="price")
    private BigDecimal price;

    @Column(name="total")
    private BigDecimal total;

    @Column(name="total_savings")
    private BigDecimal totalSavings;

    @Column(name="number_of_items")
    private Integer numberOfItems;

}
