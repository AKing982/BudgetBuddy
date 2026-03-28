package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.domain.BPRowType;
import com.app.budgetbuddy.domain.CategoryType;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name="bp_rows")
@Getter
@Setter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BPRowEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="bp_template_detail_id")
    private BPTemplateDetailEntity bpTemplateDetail;

    @Column(name="category")
    private String category;

    @Column(name="category_type")
    @Enumerated(EnumType.STRING)
    private CategoryType categoryType;

    @Column(name="row_type")
    @Enumerated(EnumType.STRING)
    private BPRowType rowType;

    @Column(name="row_index")
    private int rowIndex;

    @OneToMany(mappedBy="bpRow", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BPCellEntity> cells = new ArrayList<>();


}
