package com.stockle.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockle.model.DailyPuzzle;
import com.stockle.model.Stock;
import com.stockle.repository.DailyPuzzleRepository;
import com.stockle.repository.StockRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.DayOfWeek;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class GameController {

    private final StockRepository stockRepo;
    private final DailyPuzzleRepository puzzles;
    private final ObjectMapper objectMapper;

    public GameController(
            StockRepository stockRepository,
            DailyPuzzleRepository dailyPuzzleRepository) {
        this.stockRepo = stockRepository;
        this.puzzles = dailyPuzzleRepository;
        this.objectMapper = new ObjectMapper();
    }

    @GetMapping("/puzzle/today/hint")
    public ResponseEntity<?> getHint(@RequestParam int level) {
        LocalDate today = LocalDate.now();
        DailyPuzzle puzzle = puzzles.findById(today).orElse(null);
        if (puzzle == null) return ResponseEntity.notFound().build();

        Stock stock = stockRepo.findById(puzzle.getTicker()).orElse(null);
        if (stock == null) return ResponseEntity.internalServerError().body(Map.of("error", "puzzle stock not found"));

        Map<String, Object> response = new HashMap<>();
        response.put("level", level);

        if (level >= 1) response.put("sector", stock.getSector());
        if (level >= 2) response.put("industry", stock.getIndustry());
        if (level >= 3) response.put("ticker", stock.getTicker());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/puzzle/today/chart")
    public ResponseEntity<?> getChartData(@RequestParam(defaultValue = "1M") String range) {
        LocalDate today = LocalDate.now();
        DailyPuzzle puzzle = puzzles.findById(today).orElse(null);
        if (puzzle == null) return ResponseEntity.notFound().build();

        List<Map<String, Object>> priceHistory;
        try {
            priceHistory = objectMapper.readValue(
                puzzle.getPriceHistory(),
                new TypeReference<List<Map<String, Object>>>() {}
            );
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to parse price history"));
        }

        if (priceHistory.isEmpty()) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "No price history available"));
        }

        List<Map<String, Object>> chartData = aggregateByRange(priceHistory, range);
        return ResponseEntity.ok(Map.of("range", range, "data", chartData));
    }

    private List<Map<String, Object>> aggregateByRange(List<Map<String, Object>> data, String range) {
        if (data.isEmpty()) {
            return new ArrayList<>();
        }

        String latestDateStr = (String) data.get(data.size() - 1).get("date");
        LocalDate latestDate = LocalDate.parse(latestDateStr);
        List<Map<String, Object>> result = new ArrayList<>();

        switch (range.toUpperCase()) {
            case "1W":
                LocalDate weekStart = latestDate.minusDays(7);
                for (Map<String, Object> point : data) {
                    LocalDate pointDate = LocalDate.parse((String) point.get("date"));
                    if (!pointDate.isBefore(weekStart)) {
                        result.add(Map.of(
                            "time", point.get("date"),
                            "value", getClosePrice(point)
                        ));
                    }
                }
                break;

            case "1M":
                LocalDate monthStart = latestDate.minusMonths(1);
                for (Map<String, Object> point : data) {
                    LocalDate pointDate = LocalDate.parse((String) point.get("date"));
                    if (!pointDate.isBefore(monthStart)) {
                        result.add(Map.of(
                            "time", point.get("date"),
                            "value", getClosePrice(point)
                        ));
                    }
                }
                break;

            case "1Y":
                LocalDate yearStart = latestDate.minusYears(1);
                Map<String, Double> weeklyData = new HashMap<>();
                Map<String, String> weeklyDates = new HashMap<>();

                for (Map<String, Object> point : data) {
                    LocalDate pointDate = LocalDate.parse((String) point.get("date"));
                    if (!pointDate.isBefore(yearStart)) {
                        LocalDate weekEnd = pointDate.with(TemporalAdjusters.nextOrSame(DayOfWeek.FRIDAY));
                        String weekKey = weekEnd.toString();
                        weeklyData.put(weekKey, getClosePrice(point));
                        weeklyDates.put(weekKey, (String) point.get("date"));
                    }
                }

                weeklyDates.keySet().stream()
                    .sorted()
                    .forEach(weekKey -> result.add(Map.of(
                        "time", weeklyDates.get(weekKey),
                        "value", weeklyData.get(weekKey)
                    )));
                break;

            case "5Y":
            default:
                Map<String, Double> monthlyData = new HashMap<>();
                Map<String, String> monthlyDates = new HashMap<>();

                for (Map<String, Object> point : data) {
                    LocalDate pointDate = LocalDate.parse((String) point.get("date"));
                    String monthKey = pointDate.getYear() + "-" + String.format("%02d", pointDate.getMonthValue());
                    monthlyData.put(monthKey, getClosePrice(point));
                    monthlyDates.put(monthKey, (String) point.get("date"));
                }

                monthlyDates.keySet().stream()
                    .sorted()
                    .forEach(monthKey -> result.add(Map.of(
                        "time", monthlyDates.get(monthKey),
                        "value", monthlyData.get(monthKey)
                    )));
                break;
        }

        return result;
    }

    private Double getClosePrice(Map<String, Object> point) {
        Object close = point.get("close");
        if (close instanceof Number) {
            return ((Number) close).doubleValue();
        }
        return 0.0;
    }

    @GetMapping("/puzzle/today")
    public ResponseEntity<?> getTodayPuzzle() {
        LocalDate today = LocalDate.now();
        DailyPuzzle dailyPuzzle = puzzles.findById(today).orElse(null);
        if (dailyPuzzle == null) return ResponseEntity.notFound().build();

        List<Map<String, Object>> priceHistory;
        try {
            priceHistory = objectMapper.readValue(
                dailyPuzzle.getPriceHistory(),
                new TypeReference<List<Map<String, Object>>>() {}
            );
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to parse price history"));
        }

        if (priceHistory.isEmpty()) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "No price history available"));
        }

        return ResponseEntity.ok(Map.of("puzzleDate", today.toString(), "priceHistory", priceHistory));
    }

    @PostMapping("/guess")
    public ResponseEntity<?> submitGuess(@RequestBody Map<String, String> request) {
        String ticker = request.get("ticker");
        if (ticker == null || ticker.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "ticker is required"));
        }

        LocalDate today = LocalDate.now();
        DailyPuzzle dailyPuzzle = puzzles.findById(today).orElse(null);
        if (dailyPuzzle == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "no puzzle loaded for today"));
        }

        Stock target = stockRepo.findById(dailyPuzzle.getTicker()).orElse(null);
        if (target == null) {
            return ResponseEntity.internalServerError().body(Map.of("error", "puzzle stock not found"));
        }

        Stock guess = stockRepo.findById(ticker.toUpperCase()).orElse(null);
        if (guess == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Stock not found",
                "ticker", ticker.toUpperCase()
            ));
        }

        boolean correct = ticker.equalsIgnoreCase(target.getTicker());
        Map<String, Object> comparisons = new HashMap<>();

        comparisons.put("sector", Map.of(
            "value", guess.getSector() != null ? guess.getSector() : "Unknown",
            "status", compareStrings(guess.getSector(), target.getSector())
        ));

        comparisons.put("industry", Map.of(
            "value", guess.getIndustry() != null ? guess.getIndustry() : "Unknown",
            "status", compareStrings(guess.getIndustry(), target.getIndustry())
        ));

        Long guessCap = guess.getMarketCap() != null ? guess.getMarketCap() : 0L;
        Long targetCap = target.getMarketCap() != null ? target.getMarketCap() : 0L;
        Map<String, Object> capComp = new HashMap<>();
        capComp.put("value", formatMarketCap(guessCap));
        capComp.put("status", compareNumbers(guessCap, targetCap));
        capComp.put("closeness", calculateCloseness(guessCap.doubleValue(), targetCap.doubleValue()));
        comparisons.put("marketCap", capComp);

        Double guessPrice = guess.getCurrentPrice() != null ? guess.getCurrentPrice() : 0.0;
        Double targetPrice = target.getCurrentPrice() != null ? target.getCurrentPrice() : 0.0;
        Map<String, Object> priceComp = new HashMap<>();
        priceComp.put("value", formatPrice(guessPrice));
        priceComp.put("status", compareNumbers(guessPrice, targetPrice));
        priceComp.put("closeness", calculateCloseness(guessPrice, targetPrice));
        comparisons.put("price", priceComp);

        Double guessPe = guess.getPeRatio();
        Double targetPe = target.getPeRatio();
        Map<String, Object> peComp = new HashMap<>();
        peComp.put("value", formatPeRatio(guessPe));
        peComp.put("status", compareNullableNumbers(guessPe, targetPe));
        peComp.put("closeness", calculateCloseness(guessPe != null ? guessPe : 0.0, targetPe != null ? targetPe : 0.0));
        comparisons.put("peRatio", peComp);

        Double guessDividend = guess.getDividendYield();
        Double targetDividend = target.getDividendYield();
        comparisons.put("dividendYield", Map.of(
            "value", formatDividendYield(guessDividend),
            "status", compareNullableNumbers(guessDividend, targetDividend)
        ));

        Map<String, Object> guessInfo = new HashMap<>();
        guessInfo.put("ticker", guess.getTicker());
        guessInfo.put("name", guess.getCompanyName());
        guessInfo.put("sector", guess.getSector());
        guessInfo.put("industry", guess.getIndustry());
        guessInfo.put("marketCap", guess.getMarketCap());
        guessInfo.put("price", guess.getCurrentPrice());
        guessInfo.put("peRatio", guess.getPeRatio());
        guessInfo.put("dividendYield", guess.getDividendYield());

        Map<String, Object> response = new HashMap<>();
        response.put("ticker", guess.getTicker());
        response.put("correct", correct);
        response.put("guess", guessInfo);
        response.put("comparisons", comparisons);

        return ResponseEntity.ok(response);
    }

    private String compareStrings(String guessed, String target) {
        if (guessed == null || target == null) {
            return "wrong";
        }
        return guessed.equalsIgnoreCase(target) ? "correct" : "wrong";
    }

    private String compareNumbers(Number guessed, Number target) {
        double g = guessed.doubleValue();
        double t = target.doubleValue();

        if (Math.abs(g - t) < 0.01) {
            return "correct";
        } else if (g > t) {
            return "higher";
        } else {
            return "lower";
        }
    }

    private String formatMarketCap(Long marketCap) {
        if (marketCap == null || marketCap == 0) {
            return "N/A";
        }
        if (marketCap >= 1_000_000_000_000L) {
            return String.format("%.2fT", marketCap / 1_000_000_000_000.0);
        } else if (marketCap >= 1_000_000_000L) {
            return String.format("%.2fB", marketCap / 1_000_000_000.0);
        } else if (marketCap >= 1_000_000L) {
            return String.format("%.2fM", marketCap / 1_000_000.0);
        }
        return marketCap.toString();
    }

    private String formatPrice(Double price) {
        if (price == null || price == 0) {
            return "N/A";
        }
        NumberFormat formatter = NumberFormat.getCurrencyInstance(Locale.US);
        return formatter.format(price);
    }

    private String formatPeRatio(Double pe) {
        if (pe == null) {
            return "N/A";
        }
        return String.format("%.2fx", pe);
    }

    private String formatDividendYield(Double dividend) {
        if (dividend == null) return "N/A";
        return String.format("%.2f%%", dividend / 100);
    }

    private String compareNullableNumbers(Double guessed, Double target) {
        if (guessed == null && target == null) return "correct";
        if (guessed == null || target == null) return "wrong";
        if (Math.abs(guessed - target) < 0.01) return "correct";
        return guessed > target ? "higher" : "lower";
    }

    private double calculateCloseness(double guessed, double target) {
        if (target == 0 && guessed == 0) return 1.0;
        if (target == 0 || guessed == 0) return 0.0;
        return Math.min(guessed, target) / Math.max(guessed, target);
    }
}
