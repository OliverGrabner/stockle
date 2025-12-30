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
import java.util.stream.Collectors;

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

    @GetMapping("/stocks/metadata")
    public ResponseEntity<?> getStocksMetadata() {
        List<Stock> allStocks = stockRepo.findAll();

        List<Map<String, Object>> stockMetadata = allStocks.stream()
            .map(stock -> {
                Map<String, Object> data = new HashMap<>();
                data.put("ticker", stock.getTicker());
                data.put("name", stock.getCompanyName());
                data.put("sector", stock.getSector());
                data.put("industry", stock.getIndustry());
                return data;
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("stocks", stockMetadata));
    }

    @GetMapping("/stocks/filters")
    public ResponseEntity<?> getFilterOptions() {
        List<Stock> allStocks = stockRepo.findAll();

        List<String> sectors = allStocks.stream()
            .map(Stock::getSector)
            .filter(s -> s != null && !s.isBlank())
            .distinct()
            .sorted()
            .collect(Collectors.toList());

        List<String> industries = allStocks.stream()
            .map(Stock::getIndustry)
            .filter(i -> i != null && !i.isBlank())
            .distinct()
            .sorted()
            .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
            "sectors", sectors,
            "industries", industries
        ));
    }

    @GetMapping("/puzzle/today/answer")
    public ResponseEntity<?> getAnswer() {
        LocalDate today = LocalDate.now();
        DailyPuzzle puzzle = puzzles.findById(today).orElse(null);
        if (puzzle == null) return ResponseEntity.notFound().build();

        Stock stock = stockRepo.findById(puzzle.getTicker()).orElse(null);
        if (stock == null) return ResponseEntity.internalServerError().body(Map.of("error", "puzzle stock not found"));

        return ResponseEntity.ok(Map.of(
            "ticker", stock.getTicker(),
            "name", stock.getCompanyName()
        ));
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
    public ResponseEntity<?> getChartData() {
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

        List<Map<String, Object>> chartData = priceHistory.stream()
            .map(point -> Map.of(
                "time", point.get("date"),
                "value", getClosePrice(point)
            ))
            .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("data", chartData));
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
        Map<String, Object> dividendComp = new HashMap<>();
        dividendComp.put("value", formatDividendYield(guessDividend));
        dividendComp.put("status", compareNullableNumbers(guessDividend, targetDividend));
        dividendComp.put("closeness", calculateCloseness(guessDividend != null ? guessDividend : 0.0, targetDividend != null ? targetDividend : 0.0));
        comparisons.put("dividendYield", dividendComp);

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
        double result = Math.min(guessed, target) / Math.max(guessed, target);
        // Guard against NaN or Infinity
        if (Double.isNaN(result) || Double.isInfinite(result)) return 0.0;
        return result;
    }

    @PostMapping("/stats/submit")
    public ResponseEntity<?> submitStats(@RequestBody Map<String, Object> request) {
        Integer guessCount = (Integer) request.get("guessCount");
        Boolean won = (Boolean) request.get("won");

        if (guessCount == null || won == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "guessCount and won are required"));
        }

        LocalDate today = LocalDate.now();
        DailyPuzzle puzzle = puzzles.findById(today).orElse(null);
        if (puzzle == null) {
            return ResponseEntity.notFound().build();
        }

        // Atomic increment
        puzzles.incrementStats(today, index);

        // Fetch updated stats
        puzzle = puzzles.findById(today).orElse(null);
        Integer[] distribution = puzzle.getDistribution();
        int totalPlays = puzzle.getTotalPlays();

        // Calculate average (exclude gave-ups)
        int wins = 0;
        int totalGuesses = 0;
        for (int i = 0; i < 6; i++) {
            wins += distribution[i];
            totalGuesses += distribution[i] * (i + 1);
        }
        double average = wins > 0 ? (double) totalGuesses / wins : 0;

        // Calculate percentile
        int playersYouBeat = 0;
        for (int i = index; i < 7; i++) {
            playersYouBeat += distribution[i];
        }
        double percentile = totalPlays > 0 ? (100.0 * playersYouBeat) / totalPlays : 0;

        Map<String, Object> response = new HashMap<>();
        response.put("distribution", distribution);
        response.put("totalPlays", totalPlays);
        response.put("yourResult", index);
        response.put("percentile", Math.round(percentile * 10) / 10.0);
        response.put("average", Math.round(average * 100) / 100.0);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats/today")
    public ResponseEntity<?> getTodayStats() {
        LocalDate today = LocalDate.now();
        DailyPuzzle puzzle = puzzles.findById(today).orElse(null);
        if (puzzle == null) {
            return ResponseEntity.notFound().build();
        }

        Integer[] distribution = puzzle.getDistribution();
        int totalPlays = puzzle.getTotalPlays();

        // Calculate average (NOT INCLUDING GIVING UP )
        int wins = 0;
        int totalGuesses = 0;
        for (int i = 0; i < 6; i++) {
            wins += distribution[i];
            totalGuesses += distribution[i] * (i + 1);
        }
        double average = wins > 0 ? (double) totalGuesses / wins : 0;

        Map<String, Object> response = new HashMap<>();
        response.put("distribution", distribution);
        response.put("totalPlays", totalPlays);
        response.put("average", Math.round(average * 100) / 100.0);

        return ResponseEntity.ok(response);
    }
}
