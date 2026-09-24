package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name="bp_template_pointers")
@Getter
@Setter
public class BPTemplatePointerEntity
{
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="bp_template_detail_id")
    private BPTemplateDetailEntity bpTemplateDetail;

    @Column(name="pointer_mode")
    private String pointerMode;

    @Column(name="range_start_date")
    private String rangeStartDate;

    @Column(name="range_end_date")
    private String rangeEndDate;

    @Column(name="status")
    private String status;

    @Column(name="is_locked")
    private boolean isLocked;

    @Column(name="is_update_enabled")
    private boolean isUpdateEnabled;

}
