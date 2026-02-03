package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.workbench.grocerytracker.dto.GroceryListItem;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name="groceryLists")
@Getter
@Setter
@AllArgsConstructor(access= AccessLevel.PUBLIC)
@NoArgsConstructor(access= AccessLevel.PUBLIC)
public class GroceryListEntity
{
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="groceryBudgetId")
    private GroceryBudgetEntity groceryBudget;

    @Column(name="budgeted_amount")
    private double budgetedAmount;

    @Column(name="estimated_total")
    private double estimatedTotal;

    @Column(name="actual_spent")
    private double actualSpent;

    @Column(name="list_goal")
    private double listGoal;

    @Column(name="shopping_date")
    private LocalDate shoppingDate;

    @Column(name="created_date")
    private LocalDate createdDate;

    @Column(name="modified_date")
    private LocalDate modifiedDate;

    @ElementCollection
    @CollectionTable(name="grocery_list_item",
    joinColumns = @JoinColumn(name="grocery_list_id"))
    private List<GroceryListItem> groceryItems = new ArrayList<>();
}
