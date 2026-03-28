package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.domain.BPColumnType;
import com.app.budgetbuddy.domain.Period;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Table(name="bp_columns")
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@AllArgsConstructor(access = lombok.AccessLevel.PUBLIC)
public class BPColumnEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="bp_template_detail_id")
    private BPTemplateDetailEntity bpTemplateDetail;

    @Column(name="column_index")
    private int columnIndex;

    @Column(name="start_date")
    private LocalDate startDate;

    @Column(name="end_date")
    private LocalDate endDate;

    @Column(name="period")
    @Enumerated(EnumType.STRING)
    private Period period;

    @Column(name="column_type")
    @Enumerated(EnumType.STRING)
    private BPColumnType columnType;

    @Column(name="is_header")
    private boolean isHeader;
}
