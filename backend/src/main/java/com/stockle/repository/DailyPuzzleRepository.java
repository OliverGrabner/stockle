package com.stockle.repository;

import com.stockle.model.DailyPuzzle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Repository
public interface DailyPuzzleRepository extends JpaRepository<DailyPuzzle, LocalDate> {

    DailyPuzzle findTopByOrderByPuzzleDateDesc();

    @Modifying
    @Transactional
    @Query(value = """
        UPDATE daily_puzzles
        SET distribution[:index] = distribution[:index] + 1,
            total_plays = total_plays + 1
        WHERE puzzle_date = :date
        """, nativeQuery = true)
    void incrementStats(@Param("date") LocalDate date, @Param("index") int index);
}
