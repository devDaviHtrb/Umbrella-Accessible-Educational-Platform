package com.umbrella_api.modules.course.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.umbrella_api.modules.course.model.StudentAnswers;

public interface StudentAnswersRepository extends JpaRepository<StudentAnswers, Long> {

    List<StudentAnswers> findBySubmissionId(Long submissionId);

    @Modifying
    @Query("DELETE FROM StudentAnswers sa WHERE sa.submission.id = :submissionId")
    void deleteBySubmissionId(@Param("submissionId") Long submissionId);
}