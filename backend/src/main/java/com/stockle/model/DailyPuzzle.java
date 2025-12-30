package com.stockle.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
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

    @Column(name = "distribution", columnDefinition = "integer[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    private Integer[] distribution = new Integer[]{0, 0, 0, 0, 0, 0, 0};

    @Column(name = "total_plays")
    private Integer totalPlays = 0;

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

    public Integer[] getDistribution() {
        return distribution;
    }

    public void setDistribution(Integer[] distribution) {
        this.distribution = distribution;
    }

    public Integer getTotalPlays() {
        return totalPlays;
    }

    public void setTotalPlays(Integer totalPlays) {
        this.totalPlays = totalPlays;
    }
}
