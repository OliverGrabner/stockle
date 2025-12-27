package com.stockle.model;

import jakarta.persistence.*;

@Entity
@Table(name = "stocks")
public class Stock {

    @Id
    @Column(length = 10)
    private String ticker;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "sector")
    private String sector;

    @Column(name = "industry")
    private String industry;

    @Column(name = "market_cap")
    private Long marketCap;

    @Column(name = "current_price")
    private Double currentPrice;

    @Column(name = "pe_ratio")
    private Double peRatio;

    @Column(name = "dividend_yield")
    private Double dividendYield;

    public Stock() {}

    public String getTicker() {
        return ticker;
    }

    public void setTicker(String ticker) {
        this.ticker = ticker;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getSector() {
        return sector;
    }

    public void setSector(String sector) {
        this.sector = sector;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public Long getMarketCap() {
        return marketCap;
    }

    public void setMarketCap(Long marketCap) {
        this.marketCap = marketCap;
    }

    public Double getCurrentPrice() {
        return currentPrice;
    }

    public void setCurrentPrice(Double currentPrice) {
        this.currentPrice = currentPrice;
    }

    public Double getPeRatio() {
        return peRatio;
    }

    public void setPeRatio(Double peRatio) {
        this.peRatio = peRatio;
    }

    public Double getDividendYield() {
        return dividendYield;
    }

    public void setDividendYield(Double dividendYield) {
        this.dividendYield = dividendYield;
    }
}
