package com.umbrella_api.modules.course.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * Stores the specific answer given by a student for a single question.
 */
@Entity
@Table(name = "student_answers")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAnswers {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    @JsonIgnoreProperties("answers")
    private ActivitySubmissions submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Questions question;

    // Optional: Populated if the question is multiple choice
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chosen_alternative_id")
    private Alternatives chosenAlternative;

    // Optional: Populated if the question is an essay/discursive question
    @Column(name = "essay_answer", columnDefinition = "TEXT")
    private String essayAnswer;

    @Column(name = "is_correct")
    private Boolean isCorrect;
}