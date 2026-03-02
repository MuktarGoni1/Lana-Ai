'use client';

import { useState } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Brain, Trophy, Star } from 'lucide-react';

export default function ChildLearnPage() {
  const { user } = useUnifiedAuth();
  const [activeTab, setActiveTab] = useState('lessons');

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user?.user_metadata?.nickname || 'Student'}!</h1>
          <p className="text-gray-400">Continue your learning journey</p>
        </div>

        <div className="flex gap-4 mb-8 border-b border-gray-800">
          <button 
            className={`pb-3 px-1 ${activeTab === 'lessons' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-500'}`}
            onClick={() => setActiveTab('lessons')}
          >
            Lessons
          </button>
          <button 
            className={`pb-3 px-1 ${activeTab === 'progress' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-500'}`}
            onClick={() => setActiveTab('progress')}
          >
            Progress
          </button>
          <button 
            className={`pb-3 px-1 ${activeTab === 'challenges' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-500'}`}
            onClick={() => setActiveTab('challenges')}
          >
            Challenges
          </button>
        </div>

        {activeTab === 'lessons' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <BookOpen className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Math Fundamentals</h3>
                </div>
                <p className="text-gray-400 text-sm mb-4">Learn basic arithmetic and algebra concepts</p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Start Lesson</Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-500/20 p-2 rounded-lg">
                    <Brain className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Science Exploration</h3>
                </div>
                <p className="text-gray-400 text-sm mb-4">Discover the wonders of biology and physics</p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Start Lesson</Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-500/20 p-2 rounded-lg">
                    <Star className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Creative Writing</h3>
                </div>
                <p className="text-gray-400 text-sm mb-4">Develop your storytelling and composition skills</p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Start Lesson</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <h3 className="font-semibold">Achievements</h3>
                </div>
                <p className="text-2xl font-bold">5</p>
                <p className="text-gray-400 text-sm">Badges earned</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-blue-400" />
                  <h3 className="font-semibold">Streak</h3>
                </div>
                <p className="text-2xl font-bold">7 days</p>
                <p className="text-gray-400 text-sm">Keep it up!</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-green-400" />
                  <h3 className="font-semibold">Completed</h3>
                </div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-gray-400 text-sm">Lessons finished</p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Daily Challenge</h3>
                <p className="text-gray-400 mb-4">Solve 5 math problems in under 10 minutes</p>
                <Button className="bg-green-600 hover:bg-green-700">Start Challenge</Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Weekly Goal</h3>
                <p className="text-gray-400 mb-4">Complete 3 science lessons this week</p>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                </div>
                <p className="text-right text-sm text-gray-400 mt-1">2/5 lessons completed</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}