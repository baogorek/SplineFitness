"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuizQuestion } from "@/components/practice/quiz-question"
import { MuscleFormulaQuiz } from "@/components/practice/muscle-formula/muscle-formula-quiz"
import { questions, getQuestionsByChapter, getAllChapters } from "@/data/practice-questions"

function MultipleChoiceQuiz() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)

  const chapters = getAllChapters()
  const activeQuestions = selectedChapter
    ? getQuestionsByChapter(selectedChapter)
    : questions

  const handleNext = () => {
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setCompleted(true)
    }
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setCompleted(false)
  }

  const handleChapterSelect = (chapter: number | null) => {
    setSelectedChapter(chapter)
    setCurrentIndex(0)
    setCompleted(false)
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-8">
        <Button
          variant={selectedChapter === null ? "default" : "outline"}
          size="sm"
          onClick={() => handleChapterSelect(null)}
        >
          All Chapters
        </Button>
        {chapters.map((chapter) => (
          <Button
            key={chapter}
            variant={selectedChapter === chapter ? "default" : "outline"}
            size="sm"
            onClick={() => handleChapterSelect(chapter)}
          >
            Chapter {chapter}
          </Button>
        ))}
      </div>

      {activeQuestions.length === 0 ? (
        <p className="text-muted-foreground">No questions available for this selection.</p>
      ) : completed ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Quiz Complete!</h2>
          <p className="text-muted-foreground mb-6">
            You&apos;ve completed all {activeQuestions.length} questions.
          </p>
          <Button onClick={handleRestart} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Start Over
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="text-sm text-muted-foreground mb-4">
            {currentIndex + 1} of {activeQuestions.length}
          </div>
          <QuizQuestion
            question={activeQuestions[currentIndex]}
            questionNumber={currentIndex + 1}
            onNext={handleNext}
            isLast={currentIndex === activeQuestions.length - 1}
          />
        </div>
      )}
    </>
  )
}

export default function PracticePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <Image src="/spline_logo.svg" alt="Spline Fitness" width={60} height={60} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">NSCA-CPT Practice</h1>
          <p className="text-muted-foreground">
            Test your knowledge with practice questions from the NSCA textbook
          </p>
        </div>

        <Tabs defaultValue="multiple-choice" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="multiple-choice">Multiple Choice</TabsTrigger>
            <TabsTrigger value="muscle-formula">6-Step Muscle Formula</TabsTrigger>
          </TabsList>

          <TabsContent value="multiple-choice">
            <MultipleChoiceQuiz />
          </TabsContent>

          <TabsContent value="muscle-formula">
            <MuscleFormulaQuiz />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
