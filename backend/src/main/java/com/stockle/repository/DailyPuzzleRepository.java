package com.stockle.repository;

import com.stockle.model.DailyPuzzle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface DailyPuzzleRepository extends JpaRepository<DailyPuzzle, LocalDate> {
}
