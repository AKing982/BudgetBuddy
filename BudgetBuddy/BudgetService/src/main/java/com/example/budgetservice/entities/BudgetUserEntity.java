package com.example.budgetservice.entities;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;

import java.util.Set;

@Table(name="budgetUsers")
@Entity
@Data
@Builder
public class BudgetUserEntity {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username")
    private String username;

    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinColumn(name="id")
    private Set<BudgetEntity> budgetEntitySet;

    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private Set<ExpenseEntity> expenseEntitySet;

    public BudgetUserEntity(Long id, String username) {
        this.id = id;
        this.username = username;
    }

    public BudgetUserEntity() {

    }

    public void addBudgetEntity(BudgetEntity budgetEntity) {
        budgetEntitySet.add(budgetEntity);
    }

    public void removeBudgetEntity(BudgetEntity budgetEntity) {
        this.budgetEntitySet.remove(budgetEntity);
    }



}
