import React, { useState, useEffect } from 'react';
import type { Quiz, QuizAttempt } from '../../types';
import { getAccessToken } from '../../lib/auth-client';

interface DashboardProps {
  userId: string;
}

export function Dashboard({ userId }: DashboardProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<(QuizAttempt & { quizzes: { title: string } })[]>([]);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    completedAttempts: 0,
    averageScore: 0,
    totalTime: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        setLoading(false);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${accessToken}`,
      };

      // Load quizzes
      let quizData: Quiz[] = [];
      const quizzesResponse = await fetch('/api/quizzes?limit=100', { headers });
      if (quizzesResponse.ok) {
        const data = await quizzesResponse.json();
        quizData = data.quizzes || [];
        setQuizzes(quizData);
      } else {
        console.error('[Dashboard] /api/quizzes error:', quizzesResponse.status);
      }

      // Load attempts
      const attemptsResponse = await fetch('/api/attempts/history?limit=10', { headers });
      if (attemptsResponse.ok) {
        const { attempts: attemptData } = await attemptsResponse.json();
        setAttempts(attemptData || []);

        // Calculate stats
        const completedAttempts = (attemptData || []).filter((a: any) => a.completed_at);
        const totalScore = completedAttempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0);
        const totalPoints = completedAttempts.reduce((sum: number, a: any) => sum + a.total_points, 0);
        const totalTime = completedAttempts.reduce((sum: number, a: any) => sum + a.time_taken, 0);

        setStats({
          totalQuizzes: quizData?.length || 0,
          completedAttempts: completedAttempts.length,
          averageScore: totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0,
          totalTime: Math.round(totalTime / 60), // Convert to minutes
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-2xl font-bold text-indigo-600">{stats.totalQuizzes}</div>
          <div className="text-gray-600">习题总数</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-2xl font-bold text-green-600">{stats.completedAttempts}</div>
          <div className="text-gray-600">已完成</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-2xl font-bold text-yellow-600">{stats.averageScore}%</div>
          <div className="text-gray-600">平均分数</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-2xl font-bold text-purple-600">{stats.totalTime}分钟</div>
          <div className="text-gray-600">学习时长</div>
        </div>
      </div>

      {/* Quizzes */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">我的习题</h2>
          <a
            href="/quiz/create"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            创建新习题
          </a>
        </div>

        {quizzes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            还没有创建任何习题
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg mb-2">{quiz.title}</h3>
                {quiz.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{quiz.description}</p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{formatDate(quiz.created_at)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${quiz.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {quiz.is_published ? '已发布' : '草稿'}
                  </span>
                </div>
                <div className="mt-4 flex space-x-2">
                  <a
                    href={`/quiz/${quiz.id}`}
                    className="flex-1 text-center py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    编辑
                  </a>
                  <a
                    href={`/quiz/${quiz.id}/take`}
                    className="flex-1 text-center py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                  >
                    开始答题
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Attempts */}
      <div>
        <h2 className="text-xl font-semibold mb-4">最近答题记录</h2>
        {attempts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            还没有答题记录
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">习题</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分数</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用时</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a href={`/quiz/attempts/${attempt.id}`} className="text-indigo-600 hover:text-indigo-700">
                        {attempt.quizzes.title}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${attempt.score && attempt.score / attempt.total_points >= 0.6 ? 'text-green-600' : 'text-red-600'}`}>
                        {attempt.score || 0}/{attempt.total_points}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {formatTime(attempt.time_taken)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {attempt.completed_at ? formatDate(attempt.completed_at) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}