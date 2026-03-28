package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="bp_category_group_members")
@Getter
@Setter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BPCategoryGroupMemberEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="category_group_id")
    private BPCategoryGroupEntity categoryGroup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="bp_budget_category_id")
    private BPBudgetCategoryEntity bpBudgetCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="bp_row_id")
    private BPRowEntity bpRow;
}
