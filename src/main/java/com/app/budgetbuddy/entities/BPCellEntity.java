package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.domain.BPCellColor;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Table(name="bp_cells")
@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BPCellEntity
{
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="bp_row_id")
    private BPRowEntity bpRow;

    @Column(name="column_index")
    private int columnIndex;

    @Column(name="amount", precision=19, scale=4)
    private BigDecimal amount;

    @Column(name="is_editable")
    private boolean isEditable;

    @Column(name="is_percentage")
    private boolean isPercentage;

    @Column(name="is_over_spend")
    private boolean isOverSpend;

    @Column(name="is_estimated")
    private boolean isEstimated;

    @Column(name="color")
    @Enumerated(EnumType.STRING)
    private BPCellColor color;

}
