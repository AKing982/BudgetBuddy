import {Period} from "../config/Types";

class DateRange
{
    private _startDate: Date;
    private _endDate: Date;

    constructor(start: Date, end: Date)
    {
        this._startDate = start;
        this._endDate = end;
    }

    get startDate() : Date
    {
        return this._startDate;
    }

    get endDate() : Date
    {
        return this._endDate;
    }

    // Format date as YYYY-MM-DD for LocalDate
    private formatDateForJava(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    // Add this method to control JSON serialization
    toJSON() {
        return {
            startDate: this.formatDateForJava(this._startDate),
            endDate: this.formatDateForJava(this._endDate)
        };
    }

    // Add new methods specifically for stats format
    toStatsFormat() {
        return {
            startDate: [
                this.startDate.getFullYear(),
                this.startDate.getMonth() + 1,
                this.startDate.getDate()
            ] as [number, number, number],
            endDate: [
                this.endDate.getFullYear(),
                this.endDate.getMonth() + 1,
                this.endDate.getDate()
            ] as [number, number, number]
        };
    }



    public splitByPeriod(period: Period): DateRange[] {
        switch (period) {
            case Period.MONTHLY:
                return this.splitIntoMonths();
            case Period.WEEKLY:
                return this.splitIntoWeeks();
            case Period.BIWEEKLY:
                return this.splitIntoBiWeeks();
            case Period.DAILY:
                return this.splitIntoDays();
            default:
                throw new Error(`Unsupported period: ${period}`);
        }
    }

    private getDateRangeDifference(startDate: Date, endDate: Date): number {
        return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    public incrementNextPeriod(period: Period): DateRange
    {
        const newStartDate = new Date(this.startDate);
        const newEndDate = new Date(this.endDate);

        switch (period) {
            case Period.MONTHLY:
                newStartDate.setMonth(newStartDate.getMonth() + 1);
                newEndDate.setMonth(newEndDate.getMonth() + 1);
                break;
            case Period.WEEKLY:
                newStartDate.setDate(newStartDate.getDate() + 7);
                newEndDate.setDate(newEndDate.getDate() + 7);
                break;
            case Period.BIWEEKLY:
                newStartDate.setDate(newStartDate.getDate() + 14);
                newEndDate.setDate(newEndDate.getDate() + 14);
                break;
            case Period.DAILY:
                newStartDate.setDate(newStartDate.getDate() + 1);
                newEndDate.setDate(newEndDate.getDate() + 1);
                break;
            default:
                throw new Error(`Unsupported period: ${period}`);
        }

        return new DateRange(newStartDate, newEndDate);
    }


    public splitIntoDays(): DateRange[] {
        const dateRanges: DateRange[] = [];
        let current = new Date(this.startDate);

        while (current <= this.endDate) {
            dateRanges.push(new DateRange(new Date(current), new Date(current)));
            current.setDate(current.getDate() + 1);
        }

        return dateRanges;
    }

    public splitIntoWeeks(): DateRange[] {
        const dateRanges: DateRange[] = [];
        let current = new Date(this.startDate);

        while (current <= this.endDate) {
            const rangeEnd = new Date(current);
            rangeEnd.setDate(rangeEnd.getDate() + 6);

            if (rangeEnd > this.endDate) {
                dateRanges.push(new DateRange(current, this.endDate));
            } else {
                dateRanges.push(new DateRange(new Date(current), rangeEnd));
            }

            current = new Date(rangeEnd);
            current.setDate(current.getDate() + 1);
        }

        return dateRanges;
    }

    public splitIntoBiWeeks(): DateRange[] {
        const dateRanges: DateRange[] = [];
        let current = new Date(this.startDate);

        while (current <= this.endDate) {
            const rangeEnd = new Date(current);
            rangeEnd.setDate(rangeEnd.getDate() + 13);

            if (rangeEnd > this.endDate) {
                dateRanges.push(new DateRange(current, this.endDate));
            } else {
                dateRanges.push(new DateRange(new Date(current), rangeEnd));
            }

            current = new Date(rangeEnd);
            current.setDate(current.getDate() + 1);
        }

        return dateRanges;
    }

    public splitIntoMonths(): DateRange[] {
        const dateRanges: DateRange[] = [];
        let current = new Date(this.startDate);

        while (current <= this.endDate) {
            const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

            if (monthEnd > this.endDate) {
                dateRanges.push(new DateRange(current, this.endDate));
            } else {
                dateRanges.push(new DateRange(new Date(current), monthEnd));
            }

            current = new Date(monthEnd);
            current.setDate(current.getDate() + 1);
        }

        return dateRanges;
    }

    public incrementToPreviousPeriod(period: Period): DateRange {
        const newStartDate = new Date(this.startDate);
        const newEndDate = new Date(this.endDate);

        switch (period) {
            case Period.MONTHLY:
                newStartDate.setMonth(newStartDate.getMonth() - 1);
                newEndDate.setMonth(newEndDate.getMonth() - 1);
                break;
            case Period.WEEKLY:
                newStartDate.setDate(newStartDate.getDate() - 7);
                newEndDate.setDate(newEndDate.getDate() - 7);
                break;
            case Period.BIWEEKLY:
                newStartDate.setDate(newStartDate.getDate() - 14);
                newEndDate.setDate(newEndDate.getDate() - 14);
                break;
            case Period.DAILY:
                newStartDate.setDate(newStartDate.getDate() - 1);
                newEndDate.setDate(newEndDate.getDate() - 1);
                break;
            default:
                throw new Error(`Unsupported period: ${period}`);
        }

        return new DateRange(newStartDate, newEndDate);
    }

    public containsDate(date: Date): boolean
    {
        return date >= this.startDate && date <= this.endDate;
    }

    public dateOverlaps(otherDateRange: DateRange): boolean
    {
        return this.startDate < otherDateRange.endDate && otherDateRange.startDate < this.endDate;
    }

    public isWithinMonth(date: Date): boolean
    {
        return date.getFullYear() === this.startDate.getFullYear() &&
            date.getMonth() === this.startDate.getMonth();
    }

    public isWithinBiWeek(date: Date): boolean {
        const daysDifference = this.getDateRangeDifference(this.startDate, date);
        return daysDifference >= 0 && daysDifference <= 14;
    }

    public isWithinWeek(date: Date): boolean {
        const daysDifference = this.getDateRangeDifference(this.startDate, date);
        return daysDifference >= 0 && daysDifference <= 7;
    }

    public getDaysInRange(): number {
        return this.getDateRangeDifference(this.startDate, this.endDate);
    }

    public getMonthsInRange(): number {
        return (this.endDate.getFullYear() - this.startDate.getFullYear()) * 12 +
            (this.endDate.getMonth() - this.startDate.getMonth());
    }

    public getWeeksInRange(): number {
        return Math.floor(this.getDaysInRange() / 7);
    }

    public getYearsInRange(): number {
        return this.endDate.getFullYear() - this.startDate.getFullYear();
    }

    public getBiWeeksInRange(): number {
        return Math.floor(this.getDaysInRange() / 14);
    }

    public formatDateRange(): string {
        return `${this.startDate.toISOString()} to ${this.endDate.toISOString()}`;
    }

    public compareTo(other: DateRange): number {
        let result = this.startDate.getTime() - other.startDate.getTime();
        if (result === 0) {
            result = this.endDate.getTime() - other.endDate.getTime();
        }
        return result;
    }

    public equals(other: any): boolean {
        if (this === other) return true;
        if (!(other instanceof DateRange)) return false;
        return this.startDate.getTime() === other.startDate.getTime() &&
            this.endDate.getTime() === other.endDate.getTime();
    }
}

export default DateRange;