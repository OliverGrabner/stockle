package com.stockle.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "daily_puzzles")
public class DailyPuzzle {

    @Id
    @Column(name = "puzzle_date")
    private LocalDate puzzleDate;

    @Column(nullable = false, length = 10)
    private String ticker;

    @Column(name = "price_history", columnDefinition = "jsonb")
    private String priceHistory;

    public DailyPuzzle() {}

    public LocalDate getPuzzleDate() {
        return puzzleDate;
    }

    public void setPuzzleDate(LocalDate puzzleDate) {
        this.puzzleDate = puzzleDate;
    }

    public String getTicker() {
        return ticker;
    }

    public void setTicker(String ticker) {
        this.ticker = ticker;
    }

    public String getPriceHistory() {
        return priceHistory;
    }

    public void setPriceHistory(String priceHistory) {
        this.priceHistory = priceHistory;
    }
}
