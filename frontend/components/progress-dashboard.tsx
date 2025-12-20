"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Target, 
  Clock, 
  TrendingUp, 
  Award, 
  Calendar,
  BarChart3,
  Zap
} from "lucide-react";
import { personalizationService } from "@/lib/personalization/personalization-service";
import { activityTracker } from "@/lib/tracking/activity-tracker";

interface LessonProgress {
  id: string;
  title: string;
  progress: number;
  timeSpent: number;
  lastAccessed: string;
}

interface QuizResult {
  id: string;
  title: string;
  score: number;
  date: string;
}

interface WeeklyStats {
  lessonsCompleted: number;
  quizzesTaken: number;
  timeStudied: number;
  streak: number;
}

export default function ProgressDashboard() {
  const [learningProfile, setLearningProfile] = useState<any>(null);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    lessonsCompleted: 0,
    quizzesTaken: 0,
    timeStudied: 0,
    streak: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load learning profile
      const profile = personalizationService.getLearningProfile();
      setLearningProfile(profile);
      
      // In a real implementation, you would fetch this data from your backend
      // For now, we'll use mock data
      setLessonProgress([
        {
          id: "1",
          title: "Introduction to Algebra",
          progress: 75,
          timeSpent: 45,
          lastAccessed: "2023-06-15"
        },
        {
          id: "2",
          title: "Geometry Basics",
          progress: 40,
          timeSpent: 30,
          lastAccessed: "2023-06-14"
        },
        {
          id: "3",
          title: "Fractions and Decimals",
          progress: 90,
          timeSpent: 60,
          lastAccessed: "2023-06-12"
        }
      ]);
      
      setQuizResults([
        {
          id: "1",
          title: "Algebra Fundamentals",
          score: 85,
          date: "2023-06-15"
        },
        {
          id: "2",
          title: "Geometry Quiz",
          score: 78,
          date: "2023-06-13"
        }
      ]);
      
      setWeeklyStats({
        lessonsCompleted: 3,
        quizzesTaken: 2,
        timeStudied: 135, // minutes
        streak: 5
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
          <p className="text-white/30 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Learning Progress</h1>
            <p className="text-white/60">Track your educational journey</p>
          </div>
          {learningProfile && (
            <Badge variant="secondary" className="text-sm py-1 px-3">
              <Target className="w-4 h-4 mr-2" />
              {learningProfile.knowledgeLevel} Level
            </Badge>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Lessons Completed</p>
                  <p className="text-2xl font-bold">{weeklyStats.lessonsCompleted}</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Quizzes Taken</p>
                  <p className="text-2xl font-bold">{weeklyStats.quizzesTaken}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Time Studied</p>
                  <p className="text-2xl font-bold">{Math.floor(weeklyStats.timeStudied / 60)}h {weeklyStats.timeStudied % 60}m</p>
                </div>
                <Clock className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Day Streak</p>
                  <p className="text-2xl font-bold">{weeklyStats.streak}</p>
                </div>
                <Award className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Learning Profile Section */}
        {learningProfile && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Your Learning Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="font-medium text-white/80 mb-2">Knowledge Level</h3>
                  <p className="text-lg capitalize">{learningProfile.knowledgeLevel}</p>
                </div>
                
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="font-medium text-white/80 mb-2">Learning Style</h3>
                  <p className="text-lg capitalize">{learningProfile.learningStyle.replace('-', ' ')}</p>
                </div>
                
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="font-medium text-white/80 mb-2">Preferred Difficulty</h3>
                  <p className="text-lg capitalize">{learningProfile.preferredDifficulty}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Zap className="w-4 h-4" />
                <span>Personalized recommendations based on your profile</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Lessons */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Current Lessons
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lessonProgress.map((lesson) => (
                <div key={lesson.id} className="space-y-2">
                  <div className="flex justify-between">
                    <h3 className="font-medium">{lesson.title}</h3>
                    <span className="text-sm text-white/60">{lesson.progress}%</span>
                  </div>
                  <Progress value={lesson.progress} className="w-full" />
                  <div className="flex justify-between text-sm text-white/60">
                    <span>{lesson.timeSpent} min studied</span>
                    <span>Last accessed: {lesson.lastAccessed}</span>
                  </div>
                </div>
              ))}
              
              {lessonProgress.length === 0 && (
                <p className="text-white/50 text-center py-4">No lessons in progress</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Quizzes */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recent Quizzes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quizResults.map((quiz) => (
                <div key={quiz.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <div>
                    <h3 className="font-medium">{quiz.title}</h3>
                    <p className="text-sm text-white/60">{quiz.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{quiz.score}%</span>
                    <div className={`w-3 h-3 rounded-full ${
                      quiz.score >= 80 ? 'bg-green-500' : 
                      quiz.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                </div>
              ))}
              
              {quizResults.length === 0 && (
                <p className="text-white/50 text-center py-4">No quizzes taken yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Weekly Goal */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Weekly Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Complete 5 lessons this week</span>
                <span className="font-medium">3/5</span>
              </div>
              <Progress value={60} className="w-full" />
              <p className="text-sm text-white/60">2 more lessons to reach your goal!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}