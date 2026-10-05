package com.app.budgetbuddy.domain;

public record PointerResync(BPTemplatePointer currentPointer, BPTemplatePointer futurePointer, boolean futurePointerNeedsMove) {

}
